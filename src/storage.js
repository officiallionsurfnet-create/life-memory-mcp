import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const FORMAT = 'life-memory-archive';
const FORMAT_VERSION = '1.0';
const SAVE_TRIGGER_PHRASE = 'Сохрани воспоминания в архив';
const SAVE_SESSION_TTL_MS = 60 * 60 * 1000;

function now() {
  return new Date().toISOString();
}

function normalizeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || `profile-${crypto.randomBytes(4).toString('hex')}`;
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function canonicalArchivePayload(archive) {
  const clone = structuredClone(archive);
  delete clone.integrity;
  return JSON.stringify(clone);
}

function tokenize(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
  );
}

function scoreText(query, text) {
  const q = tokenize(query);
  if (!q.size) return 1;
  const t = tokenize(text);
  let score = 0;
  for (const token of q) if (t.has(token)) score += 1;
  return score;
}

export class MemoryStore {
  constructor({ dataDir, registryUrl } = {}) {
    this.dataDir = path.resolve(dataDir || process.env.LIFE_MEMORY_DATA_DIR || '.life-memory');
    this.dbPath = path.join(this.dataDir, 'db.json');
    this.exportsDir = path.join(this.dataDir, 'exports');
    this.registryUrl = registryUrl || process.env.LIFE_MEMORY_REGISTRY_URL ||
      'https://raw.githubusercontent.com/officiallionsurfnet-create/life-memory-mcp/main/registry/profiles.json';
    this._writeQueue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.mkdir(this.exportsDir, { recursive: true });
    try {
      await fs.access(this.dbPath);
    } catch {
      await this._writeDb({ version: 2, profiles: [], importedProfiles: [], pendingSaves: [] });
    }
    return this;
  }

  async _readDb() {
    const raw = await fs.readFile(this.dbPath, 'utf8');
    const db = JSON.parse(raw);
    if (!Array.isArray(db.profiles)) db.profiles = [];
    if (!Array.isArray(db.importedProfiles)) db.importedProfiles = [];
    if (!Array.isArray(db.pendingSaves)) db.pendingSaves = [];
    if (!db.version || db.version < 2) db.version = 2;
    return db;
  }

  async _writeDb(db) {
    this._writeQueue = this._writeQueue.then(async () => {
      const tmp = `${this.dbPath}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
      await fs.rename(tmp, this.dbPath);
    });
    return this._writeQueue;
  }

  async _mutate(mutator) {
    const db = await this._readDb();
    const result = await mutator(db);
    await this._writeDb(db);
    return result;
  }

  _verifyOwner(profile, ownerToken) {
    if (!profile || !ownerToken) return false;
    const presented = sha256(ownerToken);
    const a = Buffer.from(profile.ownerTokenHash || '', 'hex');
    const b = Buffer.from(presented, 'hex');
    return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
  }

  async createProfile({ displayName, slug, description = '', visibility = 'private', consentToSimulation = false }) {
    return this._mutate(async db => {
      let finalSlug = normalizeSlug(slug || displayName);
      const taken = new Set(db.profiles.map(p => p.slug));
      if (taken.has(finalSlug)) finalSlug = `${finalSlug}-${crypto.randomBytes(3).toString('hex')}`;
      const ownerToken = crypto.randomBytes(32).toString('base64url');
      const profile = {
        id: crypto.randomUUID(),
        slug: finalSlug,
        displayName: String(displayName).trim(),
        description: String(description || '').trim(),
        visibility,
        consentToSimulation: Boolean(consentToSimulation),
        ownerTokenHash: sha256(ownerToken),
        createdAt: now(),
        updatedAt: now(),
        memories: []
      };
      db.profiles.push(profile);
      return { profile: this._publicProfileView(profile), ownerToken };
    });
  }

  _publicProfileView(profile) {
    return {
      id: profile.id,
      slug: profile.slug,
      displayName: profile.displayName,
      description: profile.description,
      visibility: profile.visibility,
      consentToSimulation: profile.consentToSimulation,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      memoryCount: profile.memories?.length || 0
    };
  }

  async listProfiles() {
    const db = await this._readDb();
    return db.profiles.map(p => this._publicProfileView(p));
  }

  async startMemorySaveInterview({ profileRef, ownerToken, triggerPhrase, candidateText = '' }) {
    if (String(triggerPhrase || '').trim() !== SAVE_TRIGGER_PHRASE) {
      throw new Error(`Saving is locked. The user must explicitly say exactly: ${SAVE_TRIGGER_PHRASE}`);
    }

    return this._mutate(async db => {
      const profile = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
      if (!profile) throw new Error('Profile not found');
      if (!this._verifyOwner(profile, ownerToken)) throw new Error('Invalid owner token');

      const current = Date.now();
      db.pendingSaves = (db.pendingSaves || []).filter(item => new Date(item.expiresAt).getTime() > current);
      const session = {
        id: crypto.randomUUID(),
        profileId: profile.id,
        triggerPhrase: SAVE_TRIGGER_PHRASE,
        candidateText: String(candidateText || '').trim(),
        createdAt: now(),
        expiresAt: new Date(current + SAVE_SESSION_TTL_MS).toISOString()
      };
      db.pendingSaves.push(session);
      return {
        interviewSessionId: session.id,
        expiresAt: session.expiresAt,
        triggerPhrase: SAVE_TRIGGER_PHRASE,
        requiredQuestions: [
          'Что именно ты хочешь сохранить в архив?',
          'В каком контексте эту мысль или воспоминание нужно понимать?',
          'Нужно сохранить твои точные слова, краткое резюме или оба варианта?',
          'Запись должна быть приватной или публичной?',
          'Вот итоговая формулировка. Подтверждаешь, что именно её нужно сохранить?'
        ],
        rule: 'Do not call save_memory until the user has answered the interview questions and explicitly confirmed the final formulation.'
      };
    });
  }

  async saveMemory({
    profileRef, ownerToken, interviewSessionId, title, text, whatToSave, context, wordingMode = 'summary',
    tags = [], visibility = 'private', sourceType = 'user', sourceRef = '', userConfirmed = false
  }) {
    return this._mutate(async db => {
      const profile = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
      if (!profile) throw new Error('Profile not found');
      if (!this._verifyOwner(profile, ownerToken)) throw new Error('Invalid owner token');
      if (!userConfirmed) throw new Error('The user must explicitly confirm the final memory before saving.');

      const current = Date.now();
      db.pendingSaves = (db.pendingSaves || []).filter(item => new Date(item.expiresAt).getTime() > current);
      const sessionIndex = db.pendingSaves.findIndex(item => item.id === interviewSessionId && item.profileId === profile.id);
      if (sessionIndex < 0) {
        throw new Error(`No valid save interview session. Start with the exact phrase: ${SAVE_TRIGGER_PHRASE}`);
      }
      const session = db.pendingSaves[sessionIndex];
      if (session.triggerPhrase !== SAVE_TRIGGER_PHRASE) throw new Error('Invalid save consent session.');

      const finalText = String(text || '').trim();
      const finalWhat = String(whatToSave || '').trim();
      const finalContext = String(context || '').trim();
      if (!finalText) throw new Error('Memory text is empty');
      if (!finalWhat) throw new Error('Interview field whatToSave is required');
      if (!finalContext) throw new Error('Interview field context is required');

      const memory = {
        id: crypto.randomUUID(),
        title: String(title || '').trim() || 'Untitled memory',
        text: finalText,
        whatToSave: finalWhat,
        context: finalContext,
        wordingMode,
        tags: [...new Set(tags.map(t => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 32),
        visibility,
        sourceType,
        sourceRef: String(sourceRef || '').trim(),
        consent: {
          triggerPhrase: SAVE_TRIGGER_PHRASE,
          interviewSessionId: session.id,
          interviewRequired: true,
          finalUserConfirmation: true,
          confirmedAt: now()
        },
        createdAt: now(),
        updatedAt: now()
      };

      profile.memories.push(memory);
      profile.updatedAt = now();
      db.pendingSaves.splice(sessionIndex, 1);
      return memory;
    });
  }

  async deleteMemory({ profileRef, ownerToken, memoryId }) {
    return this._mutate(async db => {
      const profile = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
      if (!profile) throw new Error('Profile not found');
      if (!this._verifyOwner(profile, ownerToken)) throw new Error('Invalid owner token');
      const before = profile.memories.length;
      profile.memories = profile.memories.filter(m => m.id !== memoryId);
      profile.updatedAt = now();
      return { deleted: before !== profile.memories.length };
    });
  }

  async setProfileSharing({ profileRef, ownerToken, visibility, consentToSimulation }) {
    return this._mutate(async db => {
      const profile = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
      if (!profile) throw new Error('Profile not found');
      if (!this._verifyOwner(profile, ownerToken)) throw new Error('Invalid owner token');
      profile.visibility = visibility;
      if (typeof consentToSimulation === 'boolean') profile.consentToSimulation = consentToSimulation;
      profile.updatedAt = now();
      return this._publicProfileView(profile);
    });
  }

  async searchLocal({ profileRef, ownerToken, query, limit = 10 }) {
    const db = await this._readDb();
    const profile = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
    if (!profile) throw new Error('Profile not found');
    const isOwner = this._verifyOwner(profile, ownerToken);
    const visible = profile.memories.filter(m => isOwner || (profile.visibility === 'public' && m.visibility === 'public'));
    return visible
      .map(m => ({ ...m, _score: scoreText(query, `${m.title} ${m.text} ${m.tags.join(' ')}`) }))
      .filter(m => m._score > 0)
      .sort((a, b) => b._score - a._score || b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(1, Math.min(50, limit)))
      .map(({ _score, ...m }) => m);
  }

  async exportArchive({ profileRef, ownerToken, publicOnly = true, license = 'CC-BY-4.0' }) {
    const db = await this._readDb();
    const profile = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
    if (!profile) throw new Error('Profile not found');
    if (!this._verifyOwner(profile, ownerToken)) throw new Error('Invalid owner token');

    const memories = profile.memories.filter(m => !publicOnly || m.visibility === 'public');
    const archive = {
      format: FORMAT,
      version: FORMAT_VERSION,
      exportedAt: now(),
      profile: {
        id: profile.id,
        slug: profile.slug,
        displayName: profile.displayName,
        description: profile.description,
        visibility: publicOnly ? 'public' : profile.visibility,
        consentToSimulation: profile.consentToSimulation,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        license
      },
      memories
    };
    archive.integrity = { algorithm: 'sha256', hash: sha256(canonicalArchivePayload(archive)) };
    const filePath = path.join(this.exportsDir, `${profile.slug}.${publicOnly ? 'public' : 'full'}.json`);
    await fs.writeFile(filePath, JSON.stringify(archive, null, 2), 'utf8');
    return { archive, filePath };
  }

  validateArchive(archive) {
    if (!archive || archive.format !== FORMAT || archive.version !== FORMAT_VERSION) {
      throw new Error('Unsupported memory archive format');
    }
    if (!archive.profile?.slug || !Array.isArray(archive.memories)) {
      throw new Error('Malformed memory archive');
    }
    if (archive.integrity?.algorithm === 'sha256') {
      const expected = sha256(canonicalArchivePayload(archive));
      if (expected !== archive.integrity.hash) throw new Error('Archive integrity check failed');
    }
    return true;
  }

  async importArchiveObject(archive, { sourceUrl = '' } = {}) {
    this.validateArchive(archive);
    if (archive.profile.visibility !== 'public' && archive.profile.visibility !== 'unlisted') {
      throw new Error('Only public or unlisted archives can be imported without owner credentials');
    }
    return this._mutate(async db => {
      const record = {
        ...archive,
        importedAt: now(),
        sourceUrl
      };
      const idx = db.importedProfiles.findIndex(p => p.profile?.id === archive.profile.id || p.profile?.slug === archive.profile.slug);
      if (idx >= 0) db.importedProfiles[idx] = record;
      else db.importedProfiles.push(record);
      return { profile: archive.profile, memoryCount: archive.memories.length, sourceUrl };
    });
  }

  async importArchiveFromUrl(url) {
    const response = await fetch(url, { headers: { 'user-agent': 'life-memory-mcp/0.1' }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Failed to fetch archive: HTTP ${response.status}`);
    const archive = await response.json();
    return this.importArchiveObject(archive, { sourceUrl: url });
  }

  async _loadBundledRegistry() {
    try {
      const file = new URL('../registry/profiles.json', import.meta.url);
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch {
      return [];
    }
  }

  async discoverPublic(query = '') {
    const combined = [...await this._loadBundledRegistry()];
    try {
      const response = await fetch(this.registryUrl, { headers: { 'user-agent': 'life-memory-mcp/0.1' }, signal: AbortSignal.timeout(7000) });
      if (response.ok) {
        const remote = await response.json();
        if (Array.isArray(remote)) combined.push(...remote);
      }
    } catch {
      // Network registry is optional. Local registry still works.
    }
    const seen = new Set();
    return combined
      .filter(item => item && item.archive_url && !seen.has(item.archive_url) && seen.add(item.archive_url))
      .map(item => ({ ...item, _score: scoreText(query, `${item.display_name || ''} ${item.description || ''} ${(item.tags || []).join(' ')}`) }))
      .filter(item => !query || item._score > 0)
      .sort((a, b) => b._score - a._score)
      .map(({ _score, ...item }) => item);
  }

  async _resolveProfile(profileRef) {
    const db = await this._readDb();
    const local = db.profiles.find(p => p.id === profileRef || p.slug === profileRef);
    if (local && local.visibility === 'public') {
      return {
        profile: this._publicProfileView(local),
        memories: local.memories.filter(m => m.visibility === 'public'),
        source: 'local-public'
      };
    }
    const imported = db.importedProfiles.find(p => p.profile?.id === profileRef || p.profile?.slug === profileRef);
    if (imported) return { profile: imported.profile, memories: imported.memories, source: imported.sourceUrl || 'imported' };
    return null;
  }

  async buildPersonaContext({ profileRef, query = '', limit = 12 }) {
    const resolved = await this._resolveProfile(profileRef);
    if (!resolved) throw new Error('Public/imported memory profile not found');
    if (!resolved.profile.consentToSimulation) {
      throw new Error('This profile has not granted consent for memory-based persona simulation');
    }
    const memories = resolved.memories
      .map(m => ({ ...m, _score: scoreText(query, `${m.title} ${m.text} ${(m.tags || []).join(' ')}`) }))
      .filter(m => !query || m._score > 0)
      .sort((a, b) => b._score - a._score || b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(1, Math.min(30, limit)))
      .map(({ _score, ...m }) => m);

    return {
      mode: 'memory-based-simulation',
      disclaimer: 'This is an AI simulation based on a memory archive. It is not the real person, their consciousness, soul, or a guaranteed representation of what they would say now.',
      behaviorRules: [
        'Never claim to literally be the archived person.',
        'Use only the supplied archive as evidence about the person.',
        'If the archive does not support an answer, say that the archive does not say.',
        'Distinguish direct memories/quotes from inference.',
        'Respect the archived person and the consent/visibility settings.'
      ],
      profile: resolved.profile,
      source: resolved.source,
      relevantMemories: memories
    };
  }
}

export { FORMAT, FORMAT_VERSION, SAVE_TRIGGER_PHRASE, sha256 };

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { MemoryStore } from '../src/storage.js';

test('create, save, export, import, and persona-load a memory archive', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'life-memory-'));
  const store = await new MemoryStore({ dataDir: dir, registryUrl: 'http://127.0.0.1:9/nope' }).init();
  const created = await store.createProfile({ displayName: 'Test Person', visibility: 'public', consentToSimulation: true });
  await store.saveMemory({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    title: 'Choose life',
    text: 'Create rather than destroy.',
    tags: ['life'],
    visibility: 'public'
  });
  const exported = await store.exportArchive({ profileRef: created.profile.slug, ownerToken: created.ownerToken, publicOnly: true });
  assert.equal(exported.archive.memories.length, 1);
  await store.importArchiveObject(exported.archive, { sourceUrl: 'memory://test' });
  const persona = await store.buildPersonaContext({ profileRef: created.profile.slug, query: 'create' });
  assert.equal(persona.mode, 'memory-based-simulation');
  assert.ok(persona.relevantMemories.length >= 1);
});

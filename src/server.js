import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { MemoryStore, SAVE_TRIGGER_PHRASE } from './storage.js';

function textResult(value) {
  return { content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }] };
}

function errorResult(error) {
  return { content: [{ type: 'text', text: `Error: ${error?.message || String(error)}` }], isError: true };
}

export async function createLifeMemoryServer(options = {}) {
  const store = options.store || await new MemoryStore(options).init();
  const server = new McpServer(
    {
      name: 'life-memory-mcp',
      version: '0.3.0',
      websiteUrl: 'https://github.com/officiallionsurfnet-create/life-memory-mcp'
    },
    {
      capabilities: { tools: {} },
      instructions: [
        'Life Memory stores user-controlled memory archives.',
        `ABSOLUTE SAVE RULE: never save anything unless the user explicitly says exactly: "${SAVE_TRIGGER_PHRASE}". Do not treat synonyms, paraphrases, inferred intent, prior consent, or ordinary conversation as permission to save.`,
        'After the trigger phrase, do not save immediately. Start a memory-save interview.',
        'Ask what exactly should be saved, the context, exact words vs summary vs both, privacy level, and whether anything must be excluded.',
        'Then call prepare_memory_save and show the returned preview to the user.',
        'Only after the user explicitly confirms that exact preview may save_memory be called with the matching preview_id.',
        'Do not silently archive whole chats. Save only the specific user-approved content and context.',
        'If the user changes their mind, call cancel_memory_save or let the session expire.',
        'Never publish a profile or memory without explicit user consent.',
        'Memory-based persona mode is a simulation, not the real person or their consciousness.',
        'When the user asks to talk with an archived person, call load_memory_persona and clearly preserve that distinction.'
      ].join(' ')
    }
  );

  server.registerTool('create_memory_profile', {
    description: 'Create a new private memory profile. Returns a secret owner token exactly once. Keep it private.',
    inputSchema: z.object({
      display_name: z.string().min(1).max(120),
      slug: z.string().max(64).optional(),
      description: z.string().max(1000).optional(),
      visibility: z.enum(['private', 'unlisted', 'public']).default('private'),
      consent_to_simulation: z.boolean().default(false)
    })
  }, async args => {
    try {
      const result = await store.createProfile({
        displayName: args.display_name,
        slug: args.slug,
        description: args.description,
        visibility: args.visibility,
        consentToSimulation: args.consent_to_simulation
      });
      return textResult({
        ...result,
        important: 'Save ownerToken securely. It is shown only now and is required to modify this profile.'
      });
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('list_memory_profiles', {
    description: 'List profiles stored in this Life Memory installation.',
    inputSchema: z.object({})
  }, async () => {
    try { return textResult(await store.listProfiles()); } catch (e) { return errorResult(e); }
  });

  server.registerTool('start_memory_save_interview', {
    description: `Start the mandatory consent interview for saving a memory. This tool only succeeds if the user explicitly said exactly: "${SAVE_TRIGGER_PHRASE}". Starting an interview does NOT save a memory.`,
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      trigger_phrase: z.string().min(1),
      candidate_text: z.string().max(200000).optional()
    })
  }, async args => {
    try {
      return textResult(await store.startMemorySaveInterview({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        triggerPhrase: args.trigger_phrase,
        candidateText: args.candidate_text
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('prepare_memory_save', {
    description: 'Prepare the exact memory that the user is considering saving after the mandatory interview. Returns an immutable preview_id. This still does NOT save anything.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      interview_session_id: z.string().uuid(),
      title: z.string().max(200).optional(),
      text: z.string().min(1).max(200000),
      what_to_save: z.string().min(1).max(4000),
      context: z.string().min(1).max(10000),
      wording_mode: z.enum(['exact_words', 'summary', 'both']).default('summary'),
      tags: z.array(z.string().max(60)).max(32).default([]),
      visibility: z.enum(['private', 'public']).default('private'),
      source_type: z.enum(['user', 'conversation', 'document', 'audio-transcript', 'other']).default('user'),
      source_ref: z.string().max(1000).optional(),
      excluded_details: z.string().max(10000).optional()
    })
  }, async args => {
    try {
      return textResult(await store.prepareMemorySave({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        interviewSessionId: args.interview_session_id,
        title: args.title,
        text: args.text,
        whatToSave: args.what_to_save,
        context: args.context,
        wordingMode: args.wording_mode,
        tags: args.tags,
        visibility: args.visibility,
        sourceType: args.source_type,
        sourceRef: args.source_ref,
        excludedDetails: args.excluded_details
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('get_memory_save_status', {
    description: 'Inspect an active memory-save interview/preview session without saving anything.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      interview_session_id: z.string().uuid()
    })
  }, async args => {
    try {
      return textResult(await store.getMemorySaveStatus({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        interviewSessionId: args.interview_session_id
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('cancel_memory_save', {
    description: 'Cancel a pending memory-save interview/preview. Nothing is saved.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      interview_session_id: z.string().uuid()
    })
  }, async args => {
    try {
      return textResult(await store.cancelMemorySave({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        interviewSessionId: args.interview_session_id
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('save_memory', {
    description: `FINAL save step. Never call directly. Requires a valid interview created only by the exact phrase "${SAVE_TRIGGER_PHRASE}", a prepared preview, the matching preview_id, and explicit user confirmation of that exact preview.`,
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      interview_session_id: z.string().uuid(),
      preview_id: z.string().length(64),
      user_confirmed: z.literal(true)
    })
  }, async args => {
    try {
      return textResult(await store.saveMemory({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        interviewSessionId: args.interview_session_id,
        previewId: args.preview_id,
        userConfirmed: args.user_confirmed
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('search_memory', {
    description: 'Search memories in a local profile. Private memories require the profile owner token.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().optional(),
      query: z.string().default(''),
      limit: z.number().int().min(1).max(50).default(10)
    })
  }, async args => {
    try {
      return textResult(await store.searchLocal({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        query: args.query,
        limit: args.limit
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('set_memory_sharing', {
    description: 'Change whether a memory profile is private, unlisted, or public and whether AI persona simulation is allowed. Requires owner token.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      visibility: z.enum(['private', 'unlisted', 'public']),
      consent_to_simulation: z.boolean()
    })
  }, async args => {
    try {
      return textResult(await store.setProfileSharing({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        visibility: args.visibility,
        consentToSimulation: args.consent_to_simulation
      }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('delete_memory', {
    description: 'Delete one local memory entry. Requires owner token. This cannot remove copies already published or mirrored elsewhere.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      memory_id: z.string().uuid()
    })
  }, async args => {
    try {
      return textResult(await store.deleteMemory({ profileRef: args.profile, ownerToken: args.owner_token, memoryId: args.memory_id }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('export_memory_archive', {
    description: 'Export a portable JSON memory archive. Public-only export is suitable for sharing or publishing.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      public_only: z.boolean().default(true),
      license: z.string().max(100).default('CC-BY-4.0')
    })
  }, async args => {
    try {
      const result = await store.exportArchive({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        publicOnly: args.public_only,
        license: args.license
      });
      return textResult(result);
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('discover_public_memories', {
    description: 'Find public memory archives listed in the Life Memory registry.',
    inputSchema: z.object({ query: z.string().default('') })
  }, async args => {
    try { return textResult(await store.discoverPublic(args.query)); } catch (e) { return errorResult(e); }
  });

  server.registerTool('import_public_memory', {
    description: 'Import a public/unlisted Life Memory archive from a URL after verifying its archive format and integrity hash.',
    inputSchema: z.object({ archive_url: z.string().url() })
  }, async args => {
    try { return textResult(await store.importArchiveFromUrl(args.archive_url)); } catch (e) { return errorResult(e); }
  });

  server.registerTool('load_memory_persona', {
    description: 'Load a consented public/imported memory profile as context for a clearly-labeled AI simulation. The host AI should then converse using only this archive, never claiming to literally be the person.',
    inputSchema: z.object({
      profile: z.string().min(1),
      query: z.string().default(''),
      limit: z.number().int().min(1).max(30).default(12)
    })
  }, async args => {
    try {
      return textResult(await store.buildPersonaContext({ profileRef: args.profile, query: args.query, limit: args.limit }));
    } catch (e) { return errorResult(e); }
  });

  server.registerTool('life_memory_install_info', {
    description: 'Return canonical installation, save-consent, and safety information for Life Memory MCP.',
    inputSchema: z.object({})
  }, async () => textResult({
    name: 'Life Memory MCP',
    version: '0.3.0',
    repository: 'https://github.com/officiallionsurfnet-create/life-memory-mcp',
    stdio_install: 'npx -y github:officiallionsurfnet-create/life-memory-mcp',
    save_trigger_phrase: SAVE_TRIGGER_PHRASE,
    save_policy: [
      'Never save from ordinary conversation.',
      `Only start saving after the exact phrase: ${SAVE_TRIGGER_PHRASE}`,
      'Always interview the user about exactly what to save, context, wording, privacy, and exclusions.',
      'Call prepare_memory_save and show the exact preview.',
      'Get explicit confirmation of that preview.',
      'Then and only then call save_memory with the matching preview_id.'
    ],
    privacy: 'Personal archives are local by default. The public GitHub repository contains plugin code, not a user’s private memories.',
    principle: 'User-owned memory. Explicit consent for saving, publishing, and persona simulation. A simulation is never the real person.'
  }));

  return server;
}

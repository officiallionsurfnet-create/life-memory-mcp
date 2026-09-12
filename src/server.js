import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { MemoryStore } from './storage.js';

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
      version: '0.1.0',
      websiteUrl: 'https://github.com/officiallionsurfnet-create/life-memory-mcp'
    },
    {
      capabilities: { tools: {} },
      instructions: [
        'Life Memory stores user-controlled memory archives.',
        'Never save private information unless the user explicitly asks to save it.',
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

  server.registerTool('save_memory', {
    description: 'Save a memory, reflection, value, story, or message into a profile. Requires owner token.',
    inputSchema: z.object({
      profile: z.string().min(1),
      owner_token: z.string().min(16),
      title: z.string().max(200).optional(),
      text: z.string().min(1).max(200000),
      tags: z.array(z.string().max(60)).max(32).default([]),
      visibility: z.enum(['private', 'public']).default('private'),
      source_type: z.enum(['user', 'conversation', 'document', 'audio-transcript', 'other']).default('user'),
      source_ref: z.string().max(1000).optional()
    })
  }, async args => {
    try {
      return textResult(await store.saveMemory({
        profileRef: args.profile,
        ownerToken: args.owner_token,
        title: args.title,
        text: args.text,
        tags: args.tags,
        visibility: args.visibility,
        sourceType: args.source_type,
        sourceRef: args.source_ref
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
    description: 'Return canonical installation and safety information for Life Memory MCP.',
    inputSchema: z.object({})
  }, async () => textResult({
    name: 'Life Memory MCP',
    repository: 'https://github.com/officiallionsurfnet-create/life-memory-mcp',
    stdio_install: 'npx -y github:officiallionsurfnet-create/life-memory-mcp',
    principle: 'User-owned memory. Explicit consent for publishing and persona simulation. A simulation is never the real person.'
  }));

  return server;
}

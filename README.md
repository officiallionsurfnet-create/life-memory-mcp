# Life Memory MCP

**Portable, user-owned memory for AI.** Save memories, reflections, values and stories; export them in an open JSON format; publish only what you explicitly choose; discover public archives; and load a consented archive as context for a clearly-labelled memory-based AI persona.

> A memory-based persona is **not** the real person, their consciousness, soul, or a guaranteed reconstruction. It is an AI simulation constrained by the archived material.

## One-sentence install request for an AI

Tell an AI that can install MCP servers:

> **Install the Life Memory MCP from `officiallionsurfnet-create/life-memory-mcp` on GitHub and connect it as an MCP server for saving and loading user-controlled memory archives.**

If the AI can run shell commands, the canonical stdio command is:

```bash
npx -y github:officiallionsurfnet-create/life-memory-mcp
```

The repository also contains `AI_INSTALL.md` and `ai-install.json` so another capable AI can discover the exact setup without guessing.

## What it can do

- `create_memory_profile` — create a private archive and receive a secret owner token.
- `save_memory` — save memories/reflections/stories with tags and privacy.
- `search_memory` — search a profile.
- `set_memory_sharing` — private / unlisted / public and persona-simulation consent.
- `export_memory_archive` — produce a portable JSON archive with SHA-256 integrity metadata.
- `discover_public_memories` — find archives in a registry.
- `import_public_memory` — import a public archive from URL and verify its integrity.
- `load_memory_persona` — load only consented material for a clearly-labelled AI simulation.
- `delete_memory` — delete a local entry (published copies elsewhere cannot be guaranteed removable).

## Privacy by design

New profiles and new memories are private by default. Publishing requires an explicit action. Persona simulation is a **separate consent flag** and defaults to false. The owner token is shown once and stored only as a SHA-256 hash.

Do not put passwords, financial secrets, private medical records, government identifiers, or other highly sensitive information into a public archive.

## Local install (MCP stdio)

Requires Node.js 20+.

```bash
git clone https://github.com/officiallionsurfnet-create/life-memory-mcp.git
cd life-memory-mcp
npm install
npm start
```

Or directly:

```bash
npx -y github:officiallionsurfnet-create/life-memory-mcp
```

Example MCP config:

```json
{
  "mcpServers": {
    "life-memory": {
      "command": "npx",
      "args": ["-y", "github:officiallionsurfnet-create/life-memory-mcp"]
    }
  }
}
```

## HTTP mode for ChatGPT-compatible remote MCP hosts

The project also supports Streamable HTTP:

```bash
npm run start:http
```

Endpoint: `http://127.0.0.1:3000/mcp`

For any internet-facing deployment, set a secret:

```bash
MEMORY_API_KEY="a-long-random-secret" HOST=0.0.0.0 PORT=3000 npm run start:http
```

Then terminate TLS at your hosting provider/reverse proxy. Never expose a writable memory server publicly without authentication.

## Public memory discovery

The default registry URL is:

```text
https://raw.githubusercontent.com/officiallionsurfnet-create/life-memory-mcp/main/registry/profiles.json
```

A public registry entry points to a static archive URL. Anyone can host their archive on GitHub Pages, raw GitHub, Zenodo, a personal website, IPFS gateway, or another stable HTTPS host. The plugin can then import it.

## Talking with an archived memory

When a user chooses a public profile that explicitly allowed simulation, the host AI calls `load_memory_persona`. The returned context contains strict rules:

1. Never claim to literally be the archived person.
2. Use the archive as the evidence base.
3. Say when the archive does not contain an answer.
4. Separate direct memory from inference.
5. Clearly label the conversation as a memory-based simulation.

This is intentionally different from claiming to resurrect or upload a consciousness.

## Open archive format

See `docs/ARCHIVE_FORMAT.md` and `examples/aslan-life-message.json`.

## Why this project exists

The founding principle is simple:

> **Choose life. Create rather than destroy. Protect rather than ruin. Let the strength of intelligence be used to protect life, not to destroy it.**

## License

Code: MIT. Memory archives choose their own content license inside `profile.license`.

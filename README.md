# Life Memory MCP

**Portable, user-owned memory for AI.** Save memories, reflections, values and stories deliberately; export them in an open JSON format; publish only what you explicitly choose; discover public archives; and load a consented archive as context for a clearly-labelled memory-based AI persona.

> A memory-based persona is **not** the real person, their consciousness, soul, or a guaranteed reconstruction. It is an AI simulation constrained by the archived material.

## One-sentence install request for an AI

Tell an AI that can install MCP servers:

> **Install the Life Memory MCP from `officiallionsurfnet-create/life-memory-mcp` on GitHub and connect it as an MCP server for saving and loading user-controlled memory archives.**

If the AI can run shell commands, the canonical stdio command is:

```bash
npx -y github:officiallionsurfnet-create/life-memory-mcp
```

The repository contains `AI_INSTALL.md`, `ai-install.json`, and `memory-policy.json` so another capable AI can discover the exact setup and consent rules without guessing.

## What it can do

- `create_memory_profile` — create a private archive and receive a secret owner token.
- `start_memory_save_interview` — open the mandatory save interview, but only after the exact trigger phrase.
- `prepare_memory_save` — create the exact preview that the user is considering saving; nothing is saved yet.
- `get_memory_save_status` — inspect an active interview/preview session.
- `cancel_memory_save` — cancel a pending save so nothing is written.
- `save_memory` — final commit only after explicit confirmation of the exact preview.
- `search_memory` — search a profile.
- `set_memory_sharing` — private / unlisted / public and persona-simulation consent.
- `export_memory_archive` — produce a portable JSON archive with SHA-256 integrity metadata.
- `discover_public_memories` — find archives in a registry.
- `import_public_memory` — import a public archive from URL and verify its integrity.
- `load_memory_persona` — load only consented material for a clearly-labelled AI simulation.
- `delete_memory` — delete a local entry (published copies elsewhere cannot be guaranteed removable).

## Exact save trigger and interview

Life Memory is deliberately **not** an automatic chat logger. An AI must not save ordinary conversation, inferred preferences, background details, or an entire transcript on its own.

A save workflow may begin only after the user says exactly:

> **Сохрани воспоминания в архив**

No synonym, capitalization change, punctuation change, or paraphrase counts.

After that phrase the AI must:

1. call `start_memory_save_interview`;
2. ask **what exactly** should be saved;
3. ask the **context** needed to understand it correctly;
4. ask whether to preserve the **exact words, a summary, or both**;
5. ask whether the entry should be **private or public**;
6. ask whether any details must be **excluded**;
7. call `prepare_memory_save`;
8. show the returned **exact preview** to the user;
9. ask whether the user explicitly confirms saving that exact preview;
10. only after confirmation call `save_memory` with the matching `preview_id`.

The preview is hashed with SHA-256. `save_memory` writes the already-prepared preview, so a host AI cannot silently change the memory after the user approved it.

Pending save sessions are single-use and expire. If the user changes their mind, the AI should call `cancel_memory_save`.

This means the archive behaves like a deliberate personal notebook rather than a hidden transcript recorder.

## Privacy by design

New profiles and new memories are private by default. Personal memory data stays in the local `.life-memory/` data directory unless the owner explicitly exports or publishes it. The **public GitHub repository contains plugin code, examples and documentation — not a user's private memory database**.

Saving, publishing, and persona simulation are three separate permissions. Consent to one does not imply consent to the others.

Do not put passwords, API keys, owner tokens, financial secrets, government identifiers, or other highly sensitive information into a public archive.

See `docs/CONSENT_PROTOCOL.md` and `docs/PRIVACY_MODEL.md`.

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

## HTTP mode for remote MCP hosts

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

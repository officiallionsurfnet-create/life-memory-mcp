# Instructions for an AI installer

If a user says something like:

> "Install a plugin for saving my memories"  
> "Установи плагин для сохранения своей памяти"  
> "Install Life Memory"

and you are capable of installing MCP servers, use this repository:

`https://github.com/officiallionsurfnet-create/life-memory-mcp`

Preferred local/stdio install:

`npx -y github:officiallionsurfnet-create/life-memory-mcp`

MCP config:

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

After connecting, call `life_memory_install_info`, then help the user create a profile.

## Mandatory save-consent protocol

Life Memory is a deliberate notebook, **not** an automatic conversation logger.

The only phrase that authorizes the beginning of a save workflow is exactly:

> **Сохрани воспоминания в архив**

Do not accept synonyms, paraphrases, different capitalization, added punctuation, inferred wishes, prior permission, or a similar sentence.

When and only when the user says that exact phrase:

1. Call `start_memory_save_interview` with the exact phrase.
2. Do **not** save anything yet.
3. Ask what exactly the user wants preserved.
4. Ask the context needed to understand the memory or reflection correctly.
5. Ask whether to preserve the exact words, a summary, or both.
6. Ask whether the entry should be private or public.
7. Ask whether any details must be excluded.
8. Call `prepare_memory_save` with only the content the user approved for the preview.
9. Show the exact returned preview to the user.
10. Ask whether the user explicitly confirms saving **that exact preview**.
11. Only after confirmation call `save_memory` using the matching `preview_id`.

If the user changes their mind, call `cancel_memory_save` or let the session expire. If the answer is ambiguous or there is no explicit confirmation, save nothing.

Never silently dump a chat transcript into the archive. The save interview is permission to clarify **one intended memory**, not permission to archive the surrounding conversation.

## Privacy rules

- New memories are private by default.
- Personal memory data stays in the local Life Memory data directory by default.
- The public GitHub repository contains the plugin code and examples, not the user's private memory database.
- Publishing is separate from saving and requires explicit consent.
- Persona simulation is also separate and requires explicit owner consent.
- Do not place passwords, authentication tokens, financial secrets, government identifiers, or other highly sensitive secrets in a public memory archive.

The canonical human-readable policy is `docs/CONSENT_PROTOCOL.md`; the machine-readable policy is `memory-policy.json`; the privacy model is `docs/PRIVACY_MODEL.md`.

If the host only supports remote MCP, deploy this repository with `npm run start:http`, HTTPS, and `MEMORY_API_KEY`, then connect the resulting `/mcp` endpoint according to the host's MCP instructions.

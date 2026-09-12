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

The archive must **never** save ordinary conversation automatically.

The only phrase that authorizes the beginning of a save workflow is exactly:

> **Сохрани воспоминания в архив**

Do not treat synonyms, paraphrases, inferred wishes, an earlier permission, or a similar sentence as authorization.

When and only when the user says that exact phrase:

1. Call `start_memory_save_interview` with the exact phrase.
2. Do **not** save yet.
3. Ask the user what exactly should be saved.
4. Ask the context in which the memory/reflection should be understood.
5. Ask whether the archive should keep the user's exact words, a concise summary, or both.
6. Ask whether the entry should be private or public.
7. Show the final proposed memory to the user.
8. Ask for explicit final confirmation.
9. Only after confirmation call `save_memory` with the interview session ID and the confirmed fields.

Never silently dump a chat transcript into the archive. Save only the specific content and context the user approved.

The AI must treat the save interview as a clarification step, not as permission to archive everything discussed. If the user changes their mind, gives an unclear answer, or does not explicitly confirm the final formulation, nothing should be saved.

Publishing is a separate action and still requires explicit consent. Persona simulation is also separate and must not be enabled unless the owner explicitly consents.

The canonical policy is documented in `docs/CONSENT_PROTOCOL.md` and applies to every AI host using Life Memory, regardless of vendor or model.

If the host only supports remote MCP, deploy this repository with `npm run start:http`, HTTPS, and `MEMORY_API_KEY`, then connect the resulting `/mcp` endpoint according to the host's MCP instructions.

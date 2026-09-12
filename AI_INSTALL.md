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

After connecting, call `life_memory_install_info`, then help the user create a profile. Do not publish anything unless the user explicitly asks. Do not enable persona simulation unless the user explicitly consents.

If the host only supports remote MCP, deploy this repository with `npm run start:http`, HTTPS, and `MEMORY_API_KEY`, then connect the resulting `/mcp` endpoint according to the host's MCP instructions.

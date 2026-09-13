# Life Memory Privacy Model

Life Memory separates **plugin code** from **personal memory data**.

## What the public GitHub repository contains

The repository contains source code, documentation, examples, tests, and the public discovery registry. It is not intended to contain a user's private memory database.

By default, a user's local memory database is stored under `.life-memory/`, which is excluded by `.gitignore`.

## What is private by default

- New profiles are private by default.
- New memory entries are private by default.
- Saving a memory does not automatically publish it.
- Publishing a memory is a separate decision.
- Allowing an AI to simulate a memory-based persona is another separate decision.

## Consent boundaries

There are three different permissions and they must not be merged:

1. **Save permission** — begins only with the exact phrase `Сохрани воспоминания в архив`, followed by interview, preview, and confirmation.
2. **Publish permission** — allows selected memory data to become public or unlisted.
3. **Persona-simulation permission** — allows an AI to use a public/imported archive as the evidence base for a clearly-labelled simulation.

Permission for one does not imply permission for the others.

## Sensitive information

Do not publish passwords, API keys, owner tokens, financial secrets, government identifiers, private medical records, or other secrets that could cause harm if exposed.

Even private archives should contain only information the owner intentionally chose to preserve. The plugin is designed to avoid silent transcript collection.

## Deletion limits

A local memory can be deleted from the local archive. But once a memory has been intentionally published or copied to another service, Life Memory cannot guarantee deletion of every external copy or cache.

## Remote deployments

If the MCP server is exposed over the internet:

- use HTTPS;
- set `MEMORY_API_KEY` or equivalent authentication;
- do not expose a writable server anonymously;
- protect owner tokens;
- back up private archives only to locations the owner explicitly chose.

## Core rule

The archive belongs to the user. The AI is a helper, not the owner and not an automatic recorder.

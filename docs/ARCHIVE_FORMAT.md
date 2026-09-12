# Life Memory Archive Format 1.0

A Life Memory archive is UTF-8 JSON.

Required top-level fields:

- `format`: `life-memory-archive`
- `version`: `1.0`
- `profile`: profile metadata
- `memories`: array of memory entries
- `integrity`: optional SHA-256 hash over the JSON payload with the `integrity` field removed

A public profile should explicitly set `visibility` to `public` or `unlisted`. AI persona simulation is allowed only when `profile.consentToSimulation` is `true`.

Each memory may contain:

- `id`
- `title`
- `text`
- `whatToSave` — a short user-approved description of what the entry is meant to preserve
- `context` — the user-approved context needed to understand the entry correctly
- `wordingMode` — `exact_words`, `summary`, or `both`
- `tags`
- `visibility`
- `sourceType`
- `sourceRef`
- `consent` — metadata recording that the mandatory save workflow was used
- `createdAt`
- `updatedAt`

New memories created by Life Memory MCP 0.2+ include consent metadata. Legacy/imported archives may omit these fields and remain readable.

## Save-consent rule

Life Memory MCP 0.2+ does not allow direct saving from normal conversation. A new local save must begin with the exact phrase:

`Сохрани воспоминания в архив`

The plugin then creates a short-lived interview session. The AI must ask what exactly to save, the context, the preferred wording mode, and privacy. The final formulation must be explicitly confirmed by the user before `save_memory` can succeed.

The format is deliberately simple so future software can parse it without depending on one vendor.

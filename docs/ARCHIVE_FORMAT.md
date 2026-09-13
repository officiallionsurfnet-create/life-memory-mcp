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
- `excludedDetails` — optional note describing details the user explicitly asked not to include
- `consent` — metadata recording that the mandatory save workflow was used
- `createdAt`
- `updatedAt`

Life Memory MCP 0.3+ records consent metadata similar to:

```json
{
  "triggerPhrase": "Сохрани воспоминания в архив",
  "interviewSessionId": "uuid",
  "interviewRequired": true,
  "previewRequired": true,
  "previewHash": "sha256-hex",
  "finalUserConfirmation": true,
  "confirmedAt": "ISO-8601"
}
```

The `previewHash` binds the saved entry to the exact preview that was shown before final confirmation. The save operation writes the already-prepared preview rather than accepting a rewritten memory at commit time.

Legacy/imported archives may omit the newer fields and remain readable.

## Save-consent rule

Life Memory does not allow direct saving from normal conversation. A new local save must begin with the exact phrase:

`Сохрани воспоминания в архив`

The workflow is:

1. create a short-lived interview session;
2. ask what exactly to save and the context;
3. ask wording mode, privacy, and exclusions;
4. prepare an immutable preview;
5. show the preview to the user;
6. obtain explicit confirmation;
7. save only if the supplied `preview_id` matches the prepared preview.

The format is deliberately simple so future software can parse it without depending on one vendor.

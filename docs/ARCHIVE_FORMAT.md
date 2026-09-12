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
- `tags`
- `visibility`
- `sourceType`
- `sourceRef`
- `createdAt`
- `updatedAt`

The format is deliberately simple so future software can parse it without depending on one vendor.

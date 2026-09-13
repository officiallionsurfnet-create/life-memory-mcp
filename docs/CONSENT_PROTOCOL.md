# Life Memory Consent Protocol

Life Memory is a deliberate personal notebook, not an automatic transcript logger.

## Exact trigger

A memory-save workflow may begin only after the user says exactly:

> **Сохрани воспоминания в архив**

Synonyms, paraphrases, different capitalization, added punctuation, inferred intent, prior consent, or ordinary conversation do **not** authorize saving.

The exact trigger opens only an **interview session**. It does not itself authorize the AI to choose what to save.

## Mandatory interview

After the exact trigger, the AI must not save immediately. It must ask the user:

1. **What exactly should be saved?**
2. **In what context should it be understood?**
3. **Should the archive keep the exact words, a summary, or both?**
4. **Should the entry be private or public?**
5. **Are there any details that must be excluded?**

The AI then calls `prepare_memory_save`, which creates an immutable preview and a SHA-256 `preview_id`.

The AI must show the **exact preview** to the user and ask whether that exact version should be saved.

Only after explicit confirmation may the AI call `save_memory` with the matching `preview_id`. `save_memory` writes the prepared preview, not a newly rewritten version, so the content cannot be silently changed between preview and commit.

## Cancellation and uncertainty

If the user changes their mind, says "не сохраняй", does not answer the interview clearly, or does not explicitly confirm the final preview, the AI must save nothing.

The AI should call `cancel_memory_save` when the user cancels. Pending save sessions also expire automatically.

## What is forbidden

- Automatic saving of ordinary conversation.
- Saving because the AI inferred that something was important.
- Treating a synonym or paraphrase of the trigger as permission.
- Treating earlier consent as permission for a later memory.
- Dumping an entire chat transcript into the archive without explicit user approval.
- Adding details that the user did not approve in the preview.
- Saving a modified version after the user approved a different preview.
- Publishing a private memory without separate explicit consent.
- Enabling persona simulation without separate explicit consent from the archive owner.

## Required behavior for every AI host

When Life Memory is installed, the host AI must follow this protocol regardless of model or vendor. If the exact trigger phrase was not said, the AI must treat the conversation as **not authorized for saving**.

The plugin itself enforces the main gates:

1. exact trigger phrase;
2. short-lived interview session;
3. mandatory prepared preview;
4. matching preview hash;
5. explicit final confirmation;
6. single-use save session.

## Principle

The user owns the memory. The AI may help formulate it, clarify it, and preserve context, but it must never silently decide what a person meant to preserve.

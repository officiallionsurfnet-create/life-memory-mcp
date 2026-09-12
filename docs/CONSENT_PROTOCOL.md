# Life Memory Consent Protocol

Life Memory is a deliberate personal notebook, not an automatic transcript logger.

## Exact trigger

A memory-save workflow may begin only after the user says exactly:

> **Сохрани воспоминания в архив**

Synonyms, paraphrases, inferred intent, prior consent, or ordinary conversation do **not** authorize saving.

## Mandatory interview

After the exact trigger, the AI must not save immediately. It must ask the user:

1. **What exactly should be saved?**
2. **In what context should it be understood?**
3. **Should the archive keep the exact words, a summary, or both?**
4. **Should the entry be private or public?**
5. The AI must show the final proposed memory and ask: **Do you explicitly confirm that this exact formulation should be saved?**

Only after the final confirmation may the AI call `save_memory`.

## What is forbidden

- Automatic saving of ordinary conversation.
- Saving because the AI inferred that something was important.
- Treating a synonym or paraphrase of the trigger as permission.
- Dumping an entire chat transcript into the archive without explicit user approval.
- Publishing a private memory without separate explicit consent.
- Enabling persona simulation without separate explicit consent from the archive owner.

## Required behavior for every AI host

When Life Memory is installed, the host AI must follow this same protocol regardless of model or vendor. If the exact trigger phrase was not said, the AI must treat the conversation as **not authorized for saving**.

The plugin itself also enforces the save gate: a valid interview session created through the exact trigger is required before `save_memory` can succeed, and final user confirmation is mandatory.

## Principle

The user owns the memory. The AI may help formulate it, clarify it, and preserve context, but it must never silently decide what a person meant to preserve.

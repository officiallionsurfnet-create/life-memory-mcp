# Canonical Life Memory Save Interview Example

This example shows how an AI host should behave.

## Before the trigger

**User:** I really love old family photographs. Please remember that.

**AI:** I can discuss it, but Life Memory does not save anything from ordinary conversation. To begin a deliberate archive save, the user must say the exact trigger phrase.

No tool call is made and nothing is saved.

## Exact trigger

**User:** Сохрани воспоминания в архив

The AI calls `start_memory_save_interview` and then asks questions. It does not save yet.

**AI:** Что именно ты хочешь сохранить в архив?

**User:** Что для меня старые семейные фотографии — это связь с предками и семейной историей.

**AI:** В каком контексте это нужно понимать?

**User:** Не просто как любовь к старым фотографиям, а как интерес к памяти семьи и к тому, откуда мы пришли.

**AI:** Сохранить твои точные слова, краткое резюме или оба варианта?

**User:** Краткое резюме.

**AI:** Запись должна быть приватной или публичной?

**User:** Приватной.

**AI:** Есть ли детали, которые нельзя включать?

**User:** Не нужно сохранять имена родственников из этого разговора.

The AI calls `prepare_memory_save`.

## Preview

The AI shows the returned preview exactly, for example:

> **Название:** Семейные фотографии и память предков  
> **Текст:** Старые семейные фотографии важны для пользователя как связь с предками, семейной историей и пониманием происхождения семьи.  
> **Контекст:** Это не просто эстетическая любовь к старым фотографиям, а интерес к сохранению семейной памяти.  
> **Приватность:** private  
> **Исключено:** имена родственников из текущего разговора.

**AI:** Подтверждаешь, что именно эту итоговую версию нужно сохранить в архив?

### If the user says yes clearly

**User:** Да, подтверждаю.

The AI calls `save_memory` with the matching `preview_id`.

### If the user changes anything

**User:** Нет, убери фразу про происхождение семьи.

The AI must update the proposed content by calling `prepare_memory_save` again, show the new preview, and ask for confirmation again. It must not save the old preview.

### If the user cancels

**User:** Нет, не сохраняй.

The AI calls `cancel_memory_save`. Nothing is saved.

## Important

The trigger phrase authorizes only the beginning of this interview. It never authorizes automatic archiving of the surrounding chat.

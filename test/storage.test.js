import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { MemoryStore, SAVE_TRIGGER_PHRASE } from '../src/storage.js';

async function makeStore() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'life-memory-'));
  const store = await new MemoryStore({ dataDir: dir, registryUrl: 'http://127.0.0.1:9/nope' }).init();
  const created = await store.createProfile({ displayName: 'Test Person', visibility: 'public', consentToSimulation: true });
  return { store, created };
}

test('memory saving requires the exact trigger phrase', async () => {
  const { store, created } = await makeStore();

  for (const wrong of [
    'Сохрани это в архив',
    'сохрани воспоминания в архив',
    'Сохрани воспоминания в архив.',
    ` ${SAVE_TRIGGER_PHRASE}`,
    `${SAVE_TRIGGER_PHRASE} `
  ]) {
    await assert.rejects(
      () => store.startMemorySaveInterview({
        profileRef: created.profile.slug,
        ownerToken: created.ownerToken,
        triggerPhrase: wrong
      }),
      /exactly/
    );
  }

  const interview = await store.startMemorySaveInterview({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    triggerPhrase: SAVE_TRIGGER_PHRASE
  });
  assert.ok(interview.interviewSessionId);
  assert.equal(interview.requiredQuestions.length, 6);
});

test('memory must be prepared, previewed, and explicitly confirmed before saving', async () => {
  const { store, created } = await makeStore();

  const interview = await store.startMemorySaveInterview({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    triggerPhrase: SAVE_TRIGGER_PHRASE,
    candidateText: 'Create rather than destroy.'
  });

  await assert.rejects(
    () => store.saveMemory({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      interviewSessionId: interview.interviewSessionId,
      previewId: '0'.repeat(64),
      userConfirmed: true
    }),
    /prepared and previewed/
  );

  const prepared = await store.prepareMemorySave({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    interviewSessionId: interview.interviewSessionId,
    title: 'Choose life',
    text: 'Create rather than destroy.',
    whatToSave: 'A core value about choosing creation over destruction.',
    context: 'A reflection about how intelligence should relate to life.',
    wordingMode: 'exact_words',
    tags: ['life'],
    visibility: 'public',
    excludedDetails: 'Do not include unrelated private conversation.'
  });

  assert.equal(prepared.preview.text, 'Create rather than destroy.');
  assert.equal(prepared.preview.visibility, 'public');
  assert.equal(prepared.previewId.length, 64);

  await assert.rejects(
    () => store.saveMemory({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      interviewSessionId: interview.interviewSessionId,
      previewId: prepared.previewId,
      userConfirmed: false
    }),
    /explicitly confirm/
  );

  await assert.rejects(
    () => store.saveMemory({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      interviewSessionId: interview.interviewSessionId,
      previewId: 'f'.repeat(64),
      userConfirmed: true
    }),
    /Preview mismatch/
  );

  const memory = await store.saveMemory({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    interviewSessionId: interview.interviewSessionId,
    previewId: prepared.previewId,
    userConfirmed: true
  });

  assert.equal(memory.consent.triggerPhrase, SAVE_TRIGGER_PHRASE);
  assert.equal(memory.consent.previewHash, prepared.previewId);
  assert.equal(memory.consent.finalUserConfirmation, true);
  assert.equal(memory.context, 'A reflection about how intelligence should relate to life.');
  assert.equal(memory.excludedDetails, 'Do not include unrelated private conversation.');

  const status = await store.getMemorySaveStatus({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    interviewSessionId: interview.interviewSessionId
  });
  assert.equal(status.active, false);

  await assert.rejects(
    () => store.saveMemory({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      interviewSessionId: interview.interviewSessionId,
      previewId: prepared.previewId,
      userConfirmed: true
    }),
    /No valid save interview session/
  );

  const exported = await store.exportArchive({ profileRef: created.profile.slug, ownerToken: created.ownerToken, publicOnly: true });
  assert.equal(exported.archive.memories.length, 1);
  await store.importArchiveObject(exported.archive, { sourceUrl: 'memory://test' });
  const persona = await store.buildPersonaContext({ profileRef: created.profile.slug, query: 'create' });
  assert.equal(persona.mode, 'memory-based-simulation');
  assert.ok(persona.relevantMemories.length >= 1);
});

test('a pending save can be cancelled and then cannot be committed', async () => {
  const { store, created } = await makeStore();
  const interview = await store.startMemorySaveInterview({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    triggerPhrase: SAVE_TRIGGER_PHRASE
  });

  const prepared = await store.prepareMemorySave({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    interviewSessionId: interview.interviewSessionId,
    text: 'A private thought.',
    whatToSave: 'One private thought.',
    context: 'Test context.',
    visibility: 'private'
  });

  const cancelled = await store.cancelMemorySave({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    interviewSessionId: interview.interviewSessionId
  });
  assert.equal(cancelled.cancelled, true);

  await assert.rejects(
    () => store.saveMemory({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      interviewSessionId: interview.interviewSessionId,
      previewId: prepared.previewId,
      userConfirmed: true
    }),
    /No valid save interview session/
  );
});

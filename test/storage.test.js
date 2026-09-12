import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { MemoryStore, SAVE_TRIGGER_PHRASE } from '../src/storage.js';

test('memory saving requires exact trigger, interview context, and final confirmation', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'life-memory-'));
  const store = await new MemoryStore({ dataDir: dir, registryUrl: 'http://127.0.0.1:9/nope' }).init();
  const created = await store.createProfile({ displayName: 'Test Person', visibility: 'public', consentToSimulation: true });

  await assert.rejects(
    () => store.startMemorySaveInterview({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      triggerPhrase: 'Сохрани это в архив'
    }),
    /exactly/
  );

  const interview = await store.startMemorySaveInterview({
    profileRef: created.profile.slug,
    ownerToken: created.ownerToken,
    triggerPhrase: SAVE_TRIGGER_PHRASE,
    candidateText: 'Create rather than destroy.'
  });
  assert.ok(interview.interviewSessionId);
  assert.equal(interview.requiredQuestions.length, 5);

  await assert.rejects(
    () => store.saveMemory({
      profileRef: created.profile.slug,
      ownerToken: created.ownerToken,
      interviewSessionId: interview.interviewSessionId,
      title: 'Choose life',
      text: 'Create rather than destroy.',
      whatToSave: 'A core value about choosing creation over destruction.',
      context: 'A reflection about how intelligence should relate to life.',
      tags: ['life'],
      visibility: 'public',
      userConfirmed: false
    }),
    /explicitly confirm/
  );

  const memory = await store.saveMemory({
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
    userConfirmed: true
  });
  assert.equal(memory.consent.triggerPhrase, SAVE_TRIGGER_PHRASE);
  assert.equal(memory.consent.finalUserConfirmation, true);
  assert.equal(memory.context, 'A reflection about how intelligence should relate to life.');

  const exported = await store.exportArchive({ profileRef: created.profile.slug, ownerToken: created.ownerToken, publicOnly: true });
  assert.equal(exported.archive.memories.length, 1);
  await store.importArchiveObject(exported.archive, { sourceUrl: 'memory://test' });
  const persona = await store.buildPersonaContext({ profileRef: created.profile.slug, query: 'create' });
  assert.equal(persona.mode, 'memory-based-simulation');
  assert.ok(persona.relevantMemories.length >= 1);
});

import { createApiApp } from '@seamflow/api';
import { NoteController } from '@seamflow/shared-controllers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeNoteSupabaseClient } from '../../helpers/createFakeNoteSupabaseClient.ts';

const TEST_BASE_URL = 'http://localhost';

describe('Note API', () => {
  let noteController: NoteController;

  beforeEach(() => {
    const apiApp = createApiApp({ supabaseClient: createFakeNoteSupabaseClient() });
    // Route controller requests straight into the API app — no running server needed.
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      apiApp.fetch(new Request(input, init)),
    );
    noteController = new NoteController({ baseUrl: TEST_BASE_URL });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates, lists, and deletes a note', async () => {
    const createdNote = await noteController.createNote({ title: 'First', content: 'Body' });

    const { noteList } = await noteController.listNotes();
    expect(noteList.map((note) => note.id)).toEqual([createdNote.id]);

    await noteController.deleteNote({ noteId: createdNote.id });
    const { noteList: noteListAfterDelete } = await noteController.listNotes();
    expect(noteListAfterDelete).toEqual([]);
  });

  it('surfaces validation errors with a user-friendly message', async () => {
    await expect(noteController.createNote({ title: '', content: '' })).rejects.toMatchObject({
      message: 'Please add a title to your note.',
      httpStatusCode: 400,
    });
  });

  it('returns 404 for a missing note', async () => {
    await expect(noteController.getNote({ noteId: 'missing-note-id' })).rejects.toMatchObject({
      httpStatusCode: 404,
    });
  });
});

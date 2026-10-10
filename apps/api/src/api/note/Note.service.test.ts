import { ExpectedServerError } from '@seamflow/shared-utils/error';
import { describe, expect, it } from 'vitest';

import { createFakeNoteSupabaseClient } from '../../../../../test/helpers/createFakeNoteSupabaseClient.ts';
import NoteService from './Note.service.ts';

describe('NoteService', () => {
  it('trims the title when creating a note', async () => {
    const noteService = new NoteService({ supabase: createFakeNoteSupabaseClient() });

    const createdNote = await noteService.createNote({ title: '  Hello  ', content: 'World' });

    expect(createdNote.title).toBe('Hello');
    expect(createdNote.content).toBe('World');
  });

  it('rejects an empty title', async () => {
    const noteService = new NoteService({ supabase: createFakeNoteSupabaseClient() });

    await expect(noteService.createNote({ title: '   ', content: '' })).rejects.toBeInstanceOf(
      ExpectedServerError,
    );
  });

  it('throws 404 when the note does not exist', async () => {
    const noteService = new NoteService({ supabase: createFakeNoteSupabaseClient() });

    await expect(noteService.getNote({ noteId: 'missing-note-id' })).rejects.toMatchObject({
      httpStatusCode: 404,
    });
  });
});

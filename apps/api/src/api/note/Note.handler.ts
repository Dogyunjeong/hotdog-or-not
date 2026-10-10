import type { NoteTypes } from '@seamflow/shared-types';
import type { Context } from 'hono';

import type { ApiEnv } from '../../types/ApiEnv.type.ts';
import { handleError } from '../../utils/handleError.ts';
import NoteService from './Note.service.ts';

class NoteHandler {
  private _getDependencies = (c: Context<ApiEnv, string>) => {
    const noteService = new NoteService({ supabase: c.var.getSupabaseClient() });
    return { noteService };
  };

  public listNotes = async (c: Context<ApiEnv>) => {
    try {
      const { noteService } = this._getDependencies(c);
      const noteList = await noteService.listNotes();
      const noteListResponse: NoteTypes.NoteListResponse = { noteList };
      return c.json(noteListResponse);
    } catch (error) {
      return handleError({ c, error, defaultMessage: 'We could not load your notes.' });
    }
  };

  public getNote = async (c: Context<ApiEnv, '/:noteId'>) => {
    try {
      const { noteService } = this._getDependencies(c);
      const note = await noteService.getNote({ noteId: c.req.param('noteId') });
      return c.json(note);
    } catch (error) {
      return handleError({ c, error, defaultMessage: 'We could not load this note.' });
    }
  };

  public createNote = async (c: Context<ApiEnv>) => {
    try {
      const { noteService } = this._getDependencies(c);
      const createNoteRequest = await c.req.json<NoteTypes.CreateNoteRequest>();
      const createdNote = await noteService.createNote(createNoteRequest);
      return c.json(createdNote, 201);
    } catch (error) {
      return handleError({ c, error, defaultMessage: 'We could not save your note.' });
    }
  };

  public deleteNote = async (c: Context<ApiEnv, '/:noteId'>) => {
    try {
      const { noteService } = this._getDependencies(c);
      await noteService.deleteNote({ noteId: c.req.param('noteId') });
      return c.body(null, 204);
    } catch (error) {
      return handleError({ c, error, defaultMessage: 'We could not delete this note.' });
    }
  };
}

export default NoteHandler;

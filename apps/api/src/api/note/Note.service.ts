import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, NoteTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';

type NoteRow = Database['public']['Tables']['notes']['Row'];

const NOTE_TITLE_MAX_LENGTH = 200;

class NoteService {
  private _supabase: SupabaseClient<Database>;

  constructor({ supabase }: { supabase: SupabaseClient<Database> }) {
    this._supabase = supabase;
  }

  private _toNote = (noteRow: NoteRow): NoteTypes.Note => {
    return {
      id: noteRow.id,
      title: noteRow.title,
      content: noteRow.content,
      createdAt: noteRow.created_at,
      updatedAt: noteRow.updated_at,
    };
  };

  private _validateCreateNoteRequest = (createNoteRequest: NoteTypes.CreateNoteRequest) => {
    const trimmedTitle = createNoteRequest.title?.trim();

    if (!trimmedTitle) {
      throw new ExpectedServerError('Please add a title to your note.');
    }

    if (trimmedTitle.length > NOTE_TITLE_MAX_LENGTH) {
      throw new ExpectedServerError(
        `Please keep the title under ${NOTE_TITLE_MAX_LENGTH} characters.`,
      );
    }
  };

  public listNotes = async (): Promise<NoteTypes.Note[]> => {
    const { data: noteRowList, error } = await this._supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }
    return noteRowList.map(this._toNote);
  };

  public getNote = async ({ noteId }: { noteId: string }): Promise<NoteTypes.Note> => {
    const { data: noteRow, error } = await this._supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!noteRow) {
      throw new ExpectedServerError('This note no longer exists.', 404);
    }
    return this._toNote(noteRow);
  };

  public createNote = async (
    createNoteRequest: NoteTypes.CreateNoteRequest,
  ): Promise<NoteTypes.Note> => {
    this._validateCreateNoteRequest(createNoteRequest);

    const { data: createdNoteRow, error } = await this._supabase
      .from('notes')
      .insert({
        title: createNoteRequest.title.trim(),
        content: createNoteRequest.content ?? '',
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }
    return this._toNote(createdNoteRow);
  };

  public deleteNote = async ({ noteId }: { noteId: string }): Promise<void> => {
    const { error } = await this._supabase.from('notes').delete().eq('id', noteId);

    if (error) {
      throw error;
    }
  };
}

export default NoteService;

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@seamflow/shared-types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type NoteInsert = Database['public']['Tables']['notes']['Insert'];

/**
 * In-memory stand-in for the `notes` table, covering only the query chains NoteService uses.
 */
export const createFakeNoteSupabaseClient = (initialNoteRowList: NoteRow[] = []) => {
  const noteRowList = [...initialNoteRowList];

  const findNoteRow = (noteId: string) => noteRowList.find((noteRow) => noteRow.id === noteId);

  const from = () => ({
    select: () => ({
      order: async () => ({
        data: [...noteRowList].sort((a, b) => b.created_at.localeCompare(a.created_at)),
        error: null,
      }),
      eq: (_column: string, noteId: string) => ({
        maybeSingle: async () => ({ data: findNoteRow(noteId) ?? null, error: null }),
      }),
    }),
    insert: (noteInsert: NoteInsert) => ({
      select: () => ({
        single: async () => {
          const now = new Date().toISOString();
          const createdNoteRow: NoteRow = {
            id: crypto.randomUUID(),
            content: '',
            created_at: now,
            updated_at: now,
            ...noteInsert,
          };
          noteRowList.push(createdNoteRow);
          return { data: createdNoteRow, error: null };
        },
      }),
    }),
    delete: () => ({
      eq: async (_column: string, noteId: string) => {
        const deletingNoteRow = findNoteRow(noteId);

        if (deletingNoteRow) {
          noteRowList.splice(noteRowList.indexOf(deletingNoteRow), 1);
        }
        return { error: null };
      },
    }),
  });

  return { from } as unknown as SupabaseClient<Database>;
};

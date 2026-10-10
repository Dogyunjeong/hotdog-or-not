import type { NoteTypes } from '@seamflow/shared-types';
import type { FetcherWithComponents } from 'react-router';

interface NoteListItemProps {
  note: NoteTypes.Note;
  noteFetcher: FetcherWithComponents<unknown>;
  deleteIntent: string;
}

const NoteListItem = ({ note, noteFetcher, deleteIntent }: NoteListItemProps) => {
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border bg-white p-4">
      <div>
        <h2 className="font-medium">{note.title}</h2>
        <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{note.content}</p>
      </div>
      <noteFetcher.Form method="post">
        <input type="hidden" name="intent" value={deleteIntent} />
        <input type="hidden" name="noteId" value={note.id} />
        <button type="submit" className="text-sm text-red-600 hover:underline">
          Delete
        </button>
      </noteFetcher.Form>
    </li>
  );
};

export default NoteListItem;

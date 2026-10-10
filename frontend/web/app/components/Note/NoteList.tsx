import type { NoteTypes } from '@seamflow/shared-types';
import type { FetcherWithComponents } from 'react-router';

import NoteListItem from './NoteListItem';

interface NoteListProps {
  noteList: NoteTypes.Note[];
  noteFetcher: FetcherWithComponents<unknown>;
  deleteIntent: string;
}

const NoteList = ({ noteList, noteFetcher, deleteIntent }: NoteListProps) => {
  if (noteList.length === 0) {
    return <p className="text-neutral-500">No notes yet. Write your first one above.</p>;
  }

  return (
    <ul className="space-y-3">
      {noteList.map((note) => (
        <NoteListItem
          key={note.id}
          note={note}
          noteFetcher={noteFetcher}
          deleteIntent={deleteIntent}
        />
      ))}
    </ul>
  );
};

export default NoteList;

import { useFetcher } from 'react-router';

import { noteController } from '@/controllers/apiControllers';
import NoteCreateForm from '@/components/Note/NoteCreateForm';
import NoteList from '@/components/Note/NoteList';

import type { Route } from './+types/home';

const NOTE_INTENT = {
  CREATE: 'create',
  DELETE: 'delete',
} as const;

export const meta = () => {
  return [{ title: 'Seamflow' }];
};

export const clientLoader = async () => {
  return noteController.listNotes();
};

export const clientAction = async ({ request }: Route.ClientActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('intent');

  switch (intent) {
    case NOTE_INTENT.CREATE:
      await noteController.createNote({
        title: String(formData.get('title') || ''),
        content: String(formData.get('content') || ''),
      });
      return { isNoteSaved: true };
    case NOTE_INTENT.DELETE:
      await noteController.deleteNote({ noteId: String(formData.get('noteId')) });
      return { isNoteSaved: false };
    default:
      throw new Error(`Unknown note intent: ${intent}`);
  }
};

export const HydrateFallback = () => {
  return <p className="p-8 text-neutral-500">Loading your notes...</p>;
};

const Home = ({ loaderData }: Route.ComponentProps) => {
  const noteFetcher = useFetcher<typeof clientAction>();

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-3xl font-semibold">Seamflow</h1>
      <NoteCreateForm noteFetcher={noteFetcher} createIntent={NOTE_INTENT.CREATE} />
      <NoteList
        noteList={loaderData.noteList}
        noteFetcher={noteFetcher}
        deleteIntent={NOTE_INTENT.DELETE}
      />
    </main>
  );
};

export default Home;

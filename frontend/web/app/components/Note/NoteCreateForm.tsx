import type { FetcherWithComponents } from 'react-router';

interface NoteCreateFormProps {
  noteFetcher: FetcherWithComponents<unknown>;
  createIntent: string;
}

const NoteCreateForm = ({ noteFetcher, createIntent }: NoteCreateFormProps) => {
  const isNoteSubmitting = noteFetcher.state !== 'idle';

  return (
    <noteFetcher.Form method="post" className="space-y-3 rounded-lg border bg-white p-4">
      <input type="hidden" name="intent" value={createIntent} />
      <input
        name="title"
        required
        maxLength={200}
        placeholder="Title"
        className="w-full rounded border px-3 py-2"
      />
      <textarea
        name="content"
        placeholder="Write something..."
        className="w-full rounded border px-3 py-2"
      />
      <button
        type="submit"
        disabled={isNoteSubmitting}
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {isNoteSubmitting ? 'Saving...' : 'Save note'}
      </button>
    </noteFetcher.Form>
  );
};

export default NoteCreateForm;

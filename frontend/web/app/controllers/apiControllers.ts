import { NoteController } from '@seamflow/shared-controllers';

// Same-origin: the API is served from this app's `/api/*` route.
export const noteController = new NoteController();

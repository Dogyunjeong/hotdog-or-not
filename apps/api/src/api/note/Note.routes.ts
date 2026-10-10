import { Hono } from 'hono';

import type { ApiEnv } from '../../types/ApiEnv.type.ts';
import NoteHandler from './Note.handler.ts';

const noteHandler = new NoteHandler();
const noteRoutes = new Hono<ApiEnv>();

noteRoutes.get('/', noteHandler.listNotes);
noteRoutes.get('/:noteId', noteHandler.getNote);
noteRoutes.post('/', noteHandler.createNote);
noteRoutes.delete('/:noteId', noteHandler.deleteNote);

export default noteRoutes;

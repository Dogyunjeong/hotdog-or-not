import type { NoteTypes } from '@seamflow/shared-types';
import { FetchRequest, type IRequest } from '@seamflow/shared-utils/requests';

class NoteController {
  private readonly _httpRequest: IRequest;

  constructor({ baseUrl = '', httpRequest }: { baseUrl?: string; httpRequest?: IRequest } = {}) {
    const apiUrl = `${baseUrl}/api`;
    httpRequest?.setBaseUrl(apiUrl);
    this._httpRequest = httpRequest || new FetchRequest({ baseUrl: apiUrl });
  }

  public setAccessToken = (accessToken: string) => {
    this._httpRequest.setAccessToken(accessToken);
  };

  public listNotes = async (): Promise<NoteTypes.NoteListResponse> => {
    const response = await this._httpRequest.get<NoteTypes.NoteListResponse>('/notes');
    return response.data;
  };

  public getNote = async ({ noteId }: { noteId: string }): Promise<NoteTypes.Note> => {
    const response = await this._httpRequest.get<NoteTypes.Note>(`/notes/${noteId}`);
    return response.data;
  };

  public createNote = async (
    createNoteRequest: NoteTypes.CreateNoteRequest,
  ): Promise<NoteTypes.Note> => {
    const response = await this._httpRequest.post<NoteTypes.Note>('/notes', createNoteRequest);
    return response.data;
  };

  public deleteNote = async ({ noteId }: { noteId: string }): Promise<void> => {
    await this._httpRequest.delete(`/notes/${noteId}`);
  };
}

export default NoteController;

import type { VisitorSessionTypes } from '@/shared/types';
import { FetchRequest, type IRequest } from '@/shared/utils/requests';

class VisitorSessionController {
  private readonly _httpRequest: IRequest;

  constructor({ baseUrl = '', httpRequest }: { baseUrl?: string; httpRequest?: IRequest } = {}) {
    const apiUrl = `${baseUrl}/api`;
    httpRequest?.setBaseUrl(apiUrl);
    this._httpRequest = httpRequest || new FetchRequest({ baseUrl: apiUrl });
  }

  /** Starts the session (sets the cookie) when history consent exists; guests get `isHistoryEnabled: false`. */
  public getCurrentVisitorSession =
    async (): Promise<VisitorSessionTypes.CurrentVisitorSessionResponse> => {
      const response =
        await this._httpRequest.get<VisitorSessionTypes.CurrentVisitorSessionResponse>(
          '/visitor-sessions/current',
        );
      return response.data;
    };

  /** Erases everything saved for this visitor (results, images, session) and clears the cookie. */
  public eraseVisitorData = async (): Promise<void> => {
    await this._httpRequest.delete('/visitor-sessions/current');
  };

  public completeOnboarding = async (): Promise<void> => {
    await this._httpRequest.post('/visitor-sessions/current/onboarding-completion');
  };
}

export default VisitorSessionController;

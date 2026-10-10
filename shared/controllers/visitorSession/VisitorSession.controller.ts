import type { VisitorSessionTypes } from '@/shared/types';
import { FetchRequest, type IRequest } from '@/shared/utils/requests';

class VisitorSessionController {
  private readonly _httpRequest: IRequest;

  constructor({ baseUrl = '', httpRequest }: { baseUrl?: string; httpRequest?: IRequest } = {}) {
    const apiUrl = `${baseUrl}/api`;
    httpRequest?.setBaseUrl(apiUrl);
    this._httpRequest = httpRequest || new FetchRequest({ baseUrl: apiUrl });
  }

  /** Also starts the session (sets the cookie) on a first visit. */
  public getCurrentVisitorSession =
    async (): Promise<VisitorSessionTypes.CurrentVisitorSessionResponse> => {
      const response =
        await this._httpRequest.get<VisitorSessionTypes.CurrentVisitorSessionResponse>(
          '/visitor-sessions/current',
        );
      return response.data;
    };

  public completeOnboarding = async (): Promise<void> => {
    await this._httpRequest.post('/visitor-sessions/current/onboarding-completion');
  };
}

export default VisitorSessionController;

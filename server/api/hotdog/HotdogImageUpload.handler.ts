import 'server-only';

import { ExpectedServerError } from '@/shared/utils/error';
import { z } from 'zod';

import VisitorSessionService from '@/server/api/visitorSession/VisitorSession.service';
import { getSupabaseClient } from '@/server/clients/supabase/getSupabaseClient';
import {
  getSupabaseStorageClient,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { handleError } from '@/server/utils/handleError';
import {
  readVisitorSessionIdFromRequest,
  withVisitorSessionCookie,
} from '@/server/utils/visitorSessionCookie';
import HotdogImageUploadService from './HotdogImageUpload.service';

const createHotdogImageUploadRequestSchema = z.object({
  mediaType: z.string(),
  byteSize: z.number().int().nonnegative(),
});

class HotdogImageUploadHandler {
  private _supabaseStorageClient?: SupabaseStorageClient;
  private _visitorSessionService?: VisitorSessionService;

  /** Dependencies are injectable for tests; production resolves them lazily from env. */
  constructor({
    supabaseStorageClient,
    visitorSessionService,
  }: {
    supabaseStorageClient?: SupabaseStorageClient;
    visitorSessionService?: VisitorSessionService;
  } = {}) {
    this._supabaseStorageClient = supabaseStorageClient;
    this._visitorSessionService = visitorSessionService;
  }

  private _getDependencies = () => {
    const hotdogImageUploadService = new HotdogImageUploadService({
      supabaseStorageClient: this._supabaseStorageClient || getSupabaseStorageClient(),
    });
    const visitorSessionService =
      this._visitorSessionService ||
      new VisitorSessionService({ supabaseClient: getSupabaseClient() });
    return { hotdogImageUploadService, visitorSessionService };
  };

  private _parseCreateHotdogImageUploadRequest = async (request: Request) => {
    const requestBody = await request.json().catch(() => undefined);
    const parsedRequest = createHotdogImageUploadRequestSchema.safeParse(requestBody);

    if (!parsedRequest.success) {
      throw new ExpectedServerError('Please choose a photo to check.');
    }
    return parsedRequest.data;
  };

  public createImageUploadSession = async (request: Request): Promise<Response> => {
    try {
      const { mediaType, byteSize } = await this._parseCreateHotdogImageUploadRequest(request);
      const { hotdogImageUploadService, visitorSessionService } = this._getDependencies();
      const visitorSession = await visitorSessionService.resolveVisitorSession({
        visitorSessionId: readVisitorSessionIdFromRequest(request),
      });

      const hotdogImageUploadSession = await hotdogImageUploadService.createImageUploadSession({
        storageFolderId: visitorSession.storageFolderId,
        mediaType,
        byteSize,
      });
      return withVisitorSessionCookie(Response.json(hotdogImageUploadSession), visitorSession.id);
    } catch (error) {
      return handleError({
        error,
        defaultMessage: "We couldn't upload your photo. Please try again.",
      });
    }
  };
}

export default HotdogImageUploadHandler;

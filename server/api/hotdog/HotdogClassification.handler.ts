import 'server-only';

import type { Database, HotdogTypes } from '@/shared/types';
import { ExpectedServerError } from '@/shared/utils/error';
import type { SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';
import { z } from 'zod';

import VisitorSessionService from '@/server/api/visitorSession/VisitorSession.service';
import { getOpenAIClient } from '@/server/clients/openai/getOpenAIClient';
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
import HotdogClassificationService from './HotdogClassification.service';

const classifyUploadedHotdogImageRequestSchema = z.object({
  tempImagePath: z.string(),
});

class HotdogClassificationHandler {
  private _openAIClient?: OpenAI;
  private _supabaseClient?: SupabaseClient<Database>;
  private _supabaseStorageClient?: SupabaseStorageClient;
  private _visitorSessionService?: VisitorSessionService;

  /** Dependencies are injectable for tests; production resolves them lazily from env. */
  constructor({
    openAIClient,
    supabaseClient,
    supabaseStorageClient,
    visitorSessionService,
  }: {
    openAIClient?: OpenAI;
    supabaseClient?: SupabaseClient<Database>;
    supabaseStorageClient?: SupabaseStorageClient;
    visitorSessionService?: VisitorSessionService;
  } = {}) {
    this._openAIClient = openAIClient;
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
    this._visitorSessionService = visitorSessionService;
  }

  private _getDependencies = () => {
    const supabaseClient = this._supabaseClient || getSupabaseClient();
    const hotdogClassificationService = new HotdogClassificationService({
      openAIClient: this._openAIClient || getOpenAIClient(),
      supabaseClient,
      supabaseStorageClient: this._supabaseStorageClient || getSupabaseStorageClient(),
    });
    const visitorSessionService =
      this._visitorSessionService || new VisitorSessionService({ supabaseClient });
    return { hotdogClassificationService, visitorSessionService };
  };

  private _parseClassifyUploadedHotdogImageRequest = async (
    request: Request,
  ): Promise<HotdogTypes.ClassifyUploadedHotdogImageRequest> => {
    const requestBody = await request.json().catch(() => undefined);
    const parsedRequest = classifyUploadedHotdogImageRequestSchema.safeParse(requestBody);

    if (!parsedRequest.success) {
      throw new ExpectedServerError('Please choose a photo to check.');
    }
    return parsedRequest.data;
  };

  public classifyUploadedImage = async (request: Request): Promise<Response> => {
    try {
      const { tempImagePath } = await this._parseClassifyUploadedHotdogImageRequest(request);
      const { hotdogClassificationService, visitorSessionService } = this._getDependencies();
      const visitorSession = await visitorSessionService.resolveVisitorSession({
        visitorSessionId: readVisitorSessionIdFromRequest(request),
      });

      const hotdogClassificationRecord = await hotdogClassificationService.classifyUploadedImage({
        visitorSessionId: visitorSession.id,
        storageFolderId: visitorSession.storageFolderId,
        tempImagePath,
      });
      return withVisitorSessionCookie(Response.json(hotdogClassificationRecord), visitorSession.id);
    } catch (error) {
      return handleError({
        error,
        defaultMessage: "We couldn't check your image right now. Please try again in a moment.",
      });
    }
  };

  public listHotdogClassifications = async (request: Request): Promise<Response> => {
    try {
      const { hotdogClassificationService, visitorSessionService } = this._getDependencies();
      const visitorSession = await visitorSessionService.resolveVisitorSession({
        visitorSessionId: readVisitorSessionIdFromRequest(request),
      });

      const hotdogClassificationListResponse: HotdogTypes.HotdogClassificationListResponse = {
        hotdogClassificationList: await hotdogClassificationService.listHotdogClassifications({
          visitorSessionId: visitorSession.id,
        }),
      };
      return withVisitorSessionCookie(
        Response.json(hotdogClassificationListResponse),
        visitorSession.id,
      );
    } catch (error) {
      return handleError({
        error,
        defaultMessage: "We couldn't load your history right now.",
      });
    }
  };
}

export default HotdogClassificationHandler;

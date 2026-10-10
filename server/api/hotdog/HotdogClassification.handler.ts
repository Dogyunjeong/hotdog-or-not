import 'server-only';

import type { Database, HotdogTypes } from '@/shared/types';
import { ExpectedServerError } from '@/shared/utils/error';
import type { SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';
import { z } from 'zod';

import {
  resolveRequestVisitorSession,
  withRequestVisitorSessionCookie,
} from '@/server/api/visitorSession/resolveRequestVisitorSession';
import VisitorSessionService, {
  type VisitorSession,
} from '@/server/api/visitorSession/VisitorSession.service';
import {
  getReverseGeocodingClient,
  type ReverseGeocodingClient,
} from '@/server/clients/geocoding/ReverseGeocoding.client';
import { getOpenAIClient } from '@/server/clients/openai/getOpenAIClient';
import { getSupabaseClient } from '@/server/clients/supabase/getSupabaseClient';
import {
  getSupabaseStorageClient,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { handleError } from '@/server/utils/handleError';
import HotdogClassificationService from './HotdogClassification.service';

const classifyUploadedHotdogImageRequestSchema = z.object({
  tempImagePath: z.string(),
});

const GUEST_HOTDOG_CLASSIFICATION_LIST_RESPONSE: HotdogTypes.HotdogClassificationListResponse = {
  isHistoryEnabled: false,
  hotdogClassificationList: [],
};

class HotdogClassificationHandler {
  private _openAIClient?: OpenAI;
  private _supabaseClient?: SupabaseClient<Database>;
  private _supabaseStorageClient?: SupabaseStorageClient;
  private _reverseGeocodingClient?: ReverseGeocodingClient;
  private _visitorSessionService?: VisitorSessionService;

  /** Dependencies are injectable for tests; production resolves them lazily from env. */
  constructor({
    openAIClient,
    supabaseClient,
    supabaseStorageClient,
    reverseGeocodingClient,
    visitorSessionService,
  }: {
    openAIClient?: OpenAI;
    supabaseClient?: SupabaseClient<Database>;
    supabaseStorageClient?: SupabaseStorageClient;
    reverseGeocodingClient?: ReverseGeocodingClient;
    visitorSessionService?: VisitorSessionService;
  } = {}) {
    this._openAIClient = openAIClient;
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
    this._reverseGeocodingClient = reverseGeocodingClient;
    this._visitorSessionService = visitorSessionService;
  }

  private _getDependencies = () => {
    const supabaseClient = this._supabaseClient || getSupabaseClient();
    const hotdogClassificationService = new HotdogClassificationService({
      openAIClient: this._openAIClient || getOpenAIClient(),
      supabaseClient,
      supabaseStorageClient: this._supabaseStorageClient || getSupabaseStorageClient(),
      reverseGeocodingClient: this._reverseGeocodingClient || getReverseGeocodingClient(),
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

  /** Visitors with history get a saved record; guests get the same result, unsaved (`id: null`). */
  private _classifyUploadedImageForVisitor = ({
    hotdogClassificationService,
    visitorSession,
    tempImagePath,
  }: {
    hotdogClassificationService: HotdogClassificationService;
    visitorSession?: VisitorSession;
    tempImagePath: string;
  }) => {
    if (!visitorSession) {
      return hotdogClassificationService.classifyGuestUploadedImage({ tempImagePath });
    }
    return hotdogClassificationService.classifyVisitorUploadedImage({
      visitorSessionId: visitorSession.id,
      storageFolderId: visitorSession.storageFolderId,
      tempImagePath,
    });
  };

  public classifyUploadedImage = async (request: Request): Promise<Response> => {
    try {
      const { tempImagePath } = await this._parseClassifyUploadedHotdogImageRequest(request);
      const { hotdogClassificationService, visitorSessionService } = this._getDependencies();
      const visitorSession = await resolveRequestVisitorSession({
        request,
        visitorSessionService,
      });

      const hotdogClassificationRecord = await this._classifyUploadedImageForVisitor({
        hotdogClassificationService,
        visitorSession,
        tempImagePath,
      });
      return withRequestVisitorSessionCookie(
        Response.json(hotdogClassificationRecord),
        visitorSession,
      );
    } catch (error) {
      return handleError({
        error,
        defaultMessage: "We couldn't check your image right now. Please try again in a moment.",
      });
    }
  };

  /** Guests have no history: an empty list without touching the database. */
  public listHotdogClassifications = async (request: Request): Promise<Response> => {
    try {
      const { hotdogClassificationService, visitorSessionService } = this._getDependencies();
      const visitorSession = await resolveRequestVisitorSession({
        request,
        visitorSessionService,
      });

      if (!visitorSession) {
        return Response.json(GUEST_HOTDOG_CLASSIFICATION_LIST_RESPONSE);
      }

      const hotdogClassificationListResponse: HotdogTypes.HotdogClassificationListResponse = {
        isHistoryEnabled: true,
        hotdogClassificationList: await hotdogClassificationService.listHotdogClassifications({
          visitorSessionId: visitorSession.id,
        }),
      };
      return withRequestVisitorSessionCookie(
        Response.json(hotdogClassificationListResponse),
        visitorSession,
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

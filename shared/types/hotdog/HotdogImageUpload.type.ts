import type { HotdogImageMediaType } from './HotdogImage.const';

export interface CreateHotdogImageUploadRequest {
  mediaType: HotdogImageMediaType;
  byteSize: number;
}

/**
 * Signed upload target in the temp bucket. The browser PUTs the raw file to `uploadUrl`
 * (single-use, valid for 2 hours).
 */
export interface HotdogImageUploadSession {
  uploadUrl: string;
  tempImagePath: string;
}

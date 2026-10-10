/** Model verdict for one image. */
export interface HotdogClassification {
  isHotdog: boolean;
  /** One short sentence explaining the verdict, shown to the user. */
  reason: string;
}

/** A stored classification as shown in the visitor's history. */
export interface HotdogClassificationRecord extends HotdogClassification {
  id: string;
  /** Short-lived signed URL (1h) for the stored image. */
  imageUrl: string;
  createdAt: string;
}

export interface ClassifyUploadedHotdogImageRequest {
  tempImagePath: string;
}

export interface HotdogClassificationListResponse {
  hotdogClassificationList: HotdogClassificationRecord[];
}

import { HotdogClassificationController, VisitorSessionController } from '@/shared/controllers';

// Same-origin: the API is served from this app's `/api` route handlers.
export const hotdogClassificationController = new HotdogClassificationController();
export const visitorSessionController = new VisitorSessionController();

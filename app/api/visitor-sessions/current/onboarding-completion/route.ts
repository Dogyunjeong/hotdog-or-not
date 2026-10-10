import VisitorSessionHandler from '@/server/api/visitorSession/VisitorSession.handler';

const visitorSessionHandler = new VisitorSessionHandler();

export const POST = (request: Request) => visitorSessionHandler.completeOnboarding(request);

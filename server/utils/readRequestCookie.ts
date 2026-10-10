/** Raw (undecoded) value of one cookie from the request's `Cookie` header. */
export const readRequestCookie = (request: Request, cookieName: string): string | undefined => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const matchingCookie = cookieHeader
    .split(';')
    .map((cookiePair) => cookiePair.trim())
    .find((cookiePair) => cookiePair.startsWith(`${cookieName}=`));
  return matchingCookie?.slice(cookieName.length + 1);
};

/**
 * vanilla-cookieconsent category ids. The server reads the same ids from the `cc_cookie`
 * consent cookie, so client config and server checks can't drift apart.
 */
export const COOKIE_CONSENT_CATEGORY = {
  /** Only the consent cookie itself. Always on. */
  NECESSARY: 'necessary',
  /** The visitor session cookie that saves classification history. */
  HISTORY: 'history',
} as const;

/** Cookie the consent library writes; holds the accepted categories as JSON. */
export const COOKIE_CONSENT_COOKIE_NAME = 'cc_cookie';

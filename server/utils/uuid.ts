const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guard ids from cookies and URLs before querying: Postgres rejects a non-uuid value for a
 * uuid column with an error (→ 500), while the caller should see "not found".
 */
export const isUuid = (value?: string): value is string => {
  return !!value && UUID_PATTERN.test(value);
};

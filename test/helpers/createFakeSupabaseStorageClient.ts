import { SupabaseStorageClient } from '@seamflow/api/supabase';
import type { Database } from '@seamflow/shared-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

/**
 * Real `SupabaseStorageClient` over a fake SDK whose `storage.from(bucket).upload(...)`
 * succeeds or returns `uploadError`.
 */
export const createFakeSupabaseStorageClient = ({
  uploadError = null,
}: { uploadError?: Error | null } = {}) => {
  const upload = vi.fn(async (filePath: string) => ({
    data: uploadError ? null : { path: filePath },
    error: uploadError,
  }));
  const from = vi.fn(() => ({ upload }));
  const supabaseClient = { storage: { from } } as unknown as SupabaseClient<Database>;
  return { supabaseStorageClient: new SupabaseStorageClient({ supabaseClient }), from, upload };
};

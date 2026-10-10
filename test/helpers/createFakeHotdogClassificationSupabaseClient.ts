import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

type HotdogClassificationRow = Database['public']['Tables']['hotdog_classifications']['Row'];
type HotdogClassificationInsert = Database['public']['Tables']['hotdog_classifications']['Insert'];

const UNIQUE_VIOLATION_ERROR = { code: '23505', message: 'duplicate key value' };

/**
 * In-memory fake of the `hotdog_classifications` table for the query chains the
 * hotdog services use: `insert().select().single()`, `select().eq().order().limit()`, and
 * `select().eq().eq().maybeSingle()`.
 * Rows get strictly increasing `created_at` so ordering is deterministic.
 */
export const createFakeHotdogClassificationSupabaseClient = ({
  insertError,
}: { insertError?: Error } = {}) => {
  const hotdogClassificationRowList: HotdogClassificationRow[] = [];
  const createdAtBaseTime = Date.parse('2026-10-10T12:00:00.000Z');

  const insertHotdogClassificationRow = (
    hotdogClassificationInsert: HotdogClassificationInsert,
  ) => {
    if (insertError) {
      return { data: null, error: insertError };
    }

    const isDuplicateImagePath = hotdogClassificationRowList.some(
      (hotdogClassificationRow) =>
        hotdogClassificationRow.original_image_path ===
        hotdogClassificationInsert.original_image_path,
    );

    if (isDuplicateImagePath) {
      return { data: null, error: UNIQUE_VIOLATION_ERROR };
    }

    const hotdogClassificationRow: HotdogClassificationRow = {
      id: crypto.randomUUID(),
      created_at: new Date(
        createdAtBaseTime + hotdogClassificationRowList.length * 1000,
      ).toISOString(),
      ...hotdogClassificationInsert,
    } as HotdogClassificationRow;
    hotdogClassificationRowList.push(hotdogClassificationRow);
    return { data: hotdogClassificationRow, error: null };
  };

  const selectHotdogClassificationRowList = () => {
    let selectedRowList = [...hotdogClassificationRowList];

    const selectQuery = {
      eq: (columnName: keyof HotdogClassificationRow, value: unknown) => {
        selectedRowList = selectedRowList.filter(
          (hotdogClassificationRow) => hotdogClassificationRow[columnName] === value,
        );
        return selectQuery;
      },
      order: (columnName: keyof HotdogClassificationRow, { ascending }: { ascending: boolean }) => {
        const sortDirection = ascending ? 1 : -1;
        selectedRowList = selectedRowList.toSorted(
          (leftRow, rightRow) =>
            String(leftRow[columnName]).localeCompare(String(rightRow[columnName])) * sortDirection,
        );
        return selectQuery;
      },
      limit: (rowCount: number) => {
        selectedRowList = selectedRowList.slice(0, rowCount);
        return selectQuery;
      },
      maybeSingle: async () => ({ data: selectedRowList[0] ?? null, error: null }),
      then: (onFulfilled: (result: { data: HotdogClassificationRow[]; error: null }) => unknown) =>
        Promise.resolve({ data: selectedRowList, error: null }).then(onFulfilled),
    };
    return selectQuery;
  };

  const from = vi.fn((tableName: string) => {
    if (tableName !== 'hotdog_classifications') {
      throw new Error(`Unexpected table: ${tableName}`);
    }
    return {
      insert: (hotdogClassificationInsert: HotdogClassificationInsert) => ({
        select: () => ({
          single: async () => insertHotdogClassificationRow(hotdogClassificationInsert),
        }),
      }),
      select: selectHotdogClassificationRowList,
    };
  });

  return {
    supabaseClient: { from } as unknown as SupabaseClient<Database>,
    hotdogClassificationRowList,
  };
};

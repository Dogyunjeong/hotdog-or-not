import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type Tables = Database['public']['Tables'];
type VisitorDataTableName =
  'visitor_sessions' | 'hotdog_classifications' | 'data_deletion_requests';
type FakeRow = Record<string, unknown>;

interface FakeQueryResult {
  data: unknown;
  count?: number | null;
  error: Error | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_COLUMN_NAME_LIST = ['id', 'visitor_session_id'];

/** Column defaults from `supabase/migrations`, applied on insert like Postgres does. */
const TABLE_COLUMN_DEFAULT_MAP: Record<VisitorDataTableName, () => FakeRow> = {
  visitor_sessions: () => ({
    storage_folder_id: crypto.randomUUID(),
    onboarding_completed_at: null,
    created_at: new Date().toISOString(),
  }),
  hotdog_classifications: () => ({
    created_at: new Date().toISOString(),
    details: null,
    details_schema_version: null,
  }),
  data_deletion_requests: () => ({
    status: 'pending',
    deleted_classification_count: 0,
    deleted_file_count: 0,
    failure_reason: null,
    requested_at: new Date().toISOString(),
    completed_at: null,
  }),
};

/**
 * In-memory fake of the visitor's tables for the query chains the visitor session, data
 * deletion and data retention services use (`select/insert/update/delete` + `eq/lt` +
 * `maybeSingle/single/select`, `select(_, { count: 'exact', head: true })`, stubbed `rpc`).
 * Like Postgres:
 * - filtering a uuid column by a non-uuid value is an error, so services must guard ids
 * - deleting a session deletes its classifications (`on delete cascade`)
 */
export const createFakeVisitorDataSupabaseClient = () => {
  const tableRowListMap: Record<VisitorDataTableName, FakeRow[]> = {
    visitor_sessions: [],
    hotdog_classifications: [],
    data_deletion_requests: [],
  };

  const deleteRowList = (tableName: VisitorDataTableName, deletedRowList: FakeRow[]) => {
    tableRowListMap[tableName] = tableRowListMap[tableName].filter(
      (row) => !deletedRowList.includes(row),
    );

    if (tableName !== 'visitor_sessions') {
      return;
    }

    const deletedVisitorSessionIdList = deletedRowList.map((row) => row.id);
    tableRowListMap.hotdog_classifications = tableRowListMap.hotdog_classifications.filter(
      (row) => !deletedVisitorSessionIdList.includes(row.visitor_session_id),
    );
  };

  /**
   * `.eq(...)` / `.lt(...)` filters, then runs on `await` (thenable) or `.maybeSingle()`.
   * `.select()` after a write returns the affected rows, like PostgREST's `return=representation`.
   */
  const createFilteredQuery = (
    tableName: VisitorDataTableName,
    runOnMatchingRowList: (matchingRowList: FakeRow[]) => FakeQueryResult,
  ) => {
    const filterList: {
      columnName: string;
      value: unknown;
      isMatching: (row: FakeRow) => boolean;
    }[] = [];

    const runQuery = (): FakeQueryResult => {
      const invalidUuidFilter = filterList.find(
        ({ columnName, value }) =>
          UUID_COLUMN_NAME_LIST.includes(columnName) && !UUID_PATTERN.test(String(value)),
      );

      if (invalidUuidFilter) {
        return {
          data: null,
          error: new Error(`invalid input syntax for type uuid: "${invalidUuidFilter.value}"`),
        };
      }

      const matchingRowList = tableRowListMap[tableName].filter((row) =>
        filterList.every(({ isMatching }) => isMatching(row)),
      );
      return runOnMatchingRowList(matchingRowList);
    };

    const filteredQuery = {
      eq: (columnName: string, value: unknown) => {
        filterList.push({ columnName, value, isMatching: (row) => row[columnName] === value });
        return filteredQuery;
      },
      lt: (columnName: string, value: string) => {
        filterList.push({
          columnName,
          value,
          isMatching: (row) => String(row[columnName]) < value,
        });
        return filteredQuery;
      },
      select: () => filteredQuery,
      maybeSingle: async () => {
        const queryResult = runQuery();

        if (queryResult.error) {
          return queryResult;
        }
        return { ...queryResult, data: (queryResult.data as FakeRow[])[0] ?? null };
      },
      then: (
        onFulfilled: (queryResult: FakeQueryResult) => unknown,
        onRejected?: (error: unknown) => unknown,
      ) => Promise.resolve(runQuery()).then(onFulfilled, onRejected),
    };
    return filteredQuery;
  };

  const insertRow = (tableName: VisitorDataTableName, insertedRow: FakeRow) => {
    const row = {
      id: crypto.randomUUID(),
      ...TABLE_COLUMN_DEFAULT_MAP[tableName](),
      ...insertedRow,
    };
    tableRowListMap[tableName].push(row);
    return row;
  };

  const from = (tableName: VisitorDataTableName) => {
    if (!(tableName in tableRowListMap)) {
      throw new Error(`Unexpected table in visitor data fake: ${tableName}`);
    }

    return {
      select: (_columnList?: string, { head = false }: { head?: boolean } = {}) =>
        createFilteredQuery(tableName, (matchingRowList) => ({
          data: head ? null : matchingRowList,
          count: matchingRowList.length,
          error: null,
        })),
      insert: (insertedRow: FakeRow) => ({
        select: () => ({
          single: async () => ({
            data: insertRow(tableName, insertedRow),
            error: null,
          }),
        }),
      }),
      update: (rowUpdate: FakeRow) =>
        createFilteredQuery(tableName, (matchingRowList) => {
          matchingRowList.forEach((row) => Object.assign(row, rowUpdate));
          return { data: matchingRowList, error: null };
        }),
      delete: () =>
        createFilteredQuery(tableName, (matchingRowList) => {
          deleteRowList(tableName, matchingRowList);
          return { data: matchingRowList, error: null };
        }),
    };
  };

  /** SQL functions are stubbed per test: `stubRpc(name, (args) => data)`. */
  const rpcHandlerMap = new Map<string, (rpcArgs: FakeRow) => unknown>();

  const rpc = async (functionName: string, rpcArgs: FakeRow) => {
    const rpcHandler = rpcHandlerMap.get(functionName);

    if (!rpcHandler) {
      throw new Error(`Unexpected rpc in visitor data fake: ${functionName}`);
    }
    return { data: rpcHandler(rpcArgs), error: null };
  };

  return {
    supabaseClient: { from, rpc } as unknown as SupabaseClient<Database>,
    stubRpc: (functionName: string, rpcHandler: (rpcArgs: FakeRow) => unknown) => {
      rpcHandlerMap.set(functionName, rpcHandler);
    },
    insertDataDeletionRequest: (
      dataDeletionRequestRow: Pick<
        Tables['data_deletion_requests']['Row'],
        'scope' | 'status' | 'requested_at'
      >,
    ) => {
      return insertRow('data_deletion_requests', dataDeletionRequestRow).id as string;
    },
    insertVisitorSession: (
      visitorSessionRow: Pick<Tables['visitor_sessions']['Row'], 'id' | 'storage_folder_id'>,
    ) => {
      insertRow('visitor_sessions', visitorSessionRow);
    },
    insertHotdogClassification: (
      hotdogClassificationRow: Pick<
        Tables['hotdog_classifications']['Row'],
        'visitor_session_id' | 'original_image_path' | 'thumbnail_image_path'
      >,
    ) => {
      return insertRow('hotdog_classifications', {
        is_hotdog: true,
        reason: 'Classic ballpark dog.',
        ...hotdogClassificationRow,
      }).id as string;
    },
    getRowList: <TableName extends VisitorDataTableName>(tableName: TableName) =>
      tableRowListMap[tableName] as Tables[TableName]['Row'][],
  };
};

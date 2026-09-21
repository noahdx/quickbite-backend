import { Knex } from 'knex';

export interface PaginationParams {
  cursor?: string;
  limit: number;
  field: string;
  orderBy: 'desc' | 'asc';
}

export interface FilterParams {
  field: string;
  value: string | string[];
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
}

export interface PaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  count: number;
}

export function applyCursorPagination(
  query: Knex.QueryBuilder,
  params: PaginationParams,
  allowedFields: Record<string, any>,
): Knex.QueryBuilder {
  if (!params.field) return query;

  let dbField = null;
  if (allowedFields) {
    const fieldCheck = Object.hasOwn(allowedFields, params.field);
    dbField = fieldCheck ? allowedFields[params.field] : 'id';
  }

  if (params.cursor) {
    const op = params.orderBy === 'asc' ? '>' : '<';
    query = query.where(dbField, op, params.cursor);
  }
  return query.orderBy(dbField, params.orderBy).limit(params.limit + 1);
}

export function applyFilters(query: Knex.QueryBuilder, filters: FilterParams[]): Knex.QueryBuilder {
  for (const filter of filters) {
    switch (filter.operator) {
      case 'eq':
        query.where(filter.field, filter.value);
        break;
      case 'gt':
        query.where(filter.field, '>', filter.value);
        break;
      case 'gte':
        query.where(filter.field, '>=', filter.value);
        break;
      case 'lt':
        query.where(filter.field, '<', filter.value);
        break;
      case 'lte':
        query.where(filter.field, '<=', filter.value);
        break;
      case 'in':
        query.whereIn(filter.field, Array.isArray(filter.value) ? filter.value : [filter.value]);
        break;

      case 'like':
        query.whereLike(filter.field, `%${filter.value}%`);
        break;

      default:
        break;
    }
  }

  return query;
}

export function buildPaginationResult<T>(rows: T[], limit: number, field: string): { data: T[]; meta: PaginationMeta } {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  let nextCursor = null;
  if (data.length > 0) {
    const lastItem = data[data.length - 1] as any;
    nextCursor = hasMore && lastItem ? String(lastItem[field]) : null;
  }

  return {
    data: data,
    meta: {
      nextCursor: nextCursor,
      hasMore: hasMore,
      count: data.length,
    },
  };
}

import { FilterParams, PaginationParams } from './cursor-pagination';

export function parsePaginationQuery(query: Record<string, unknown>): PaginationParams {
  return {
    cursor: query.cursor as string,
    limit: Math.min(100, Number(query.limit)),
    field: (query.field as string) ?? 'id',
    orderBy: query.orderBy === 'desc' ? 'desc' : 'asc',
  };
}

// Input:
/**
 * {
 *  age: {gt: 25}
 * id: {like: 432}
 * }
 */

// Processes
/**
 * extract main filter obj
 * allowedOps = set(operator)
 * loop of allowedFields:
 *    catch filter by filter
 *    extract single filter = filters[field];
 *   return  convert single filter to array by Object.entries(filter): [[key, value]]
 *    make filter func based on operator if it's include in (Set allowedOps) then pass it  and map on it:
 *      ([operator, value] => ({
 *        filed: field,
 *        value: value,
 *        operator: operator
 *      }))
 */
// Output: [{field: age, operator: 'eq', value: 25}, {field: id, operator: 'eq', value: 432}]

export function parseFilters(query: Record<string, any>, allowedFields: string[]): FilterParams[] {
  const filters = query.filter;
  if (!filters || typeof filters !== 'object') return [];
  const allowedOps = new Set(['eq', 'gt', 'gte', 'lt', 'lte', 'in', 'like']);

  return allowedFields.flatMap((field) => {
    const filter = filters[field];
    if (!filter || typeof filter !== 'object') return [];

    return Object.entries(filter)
      .filter(([op]) => allowedOps.has(op))
      .map(([operator, value]) => ({
        field: field,
        value: value as string | string[],
        operator: operator as FilterParams['operator'],
      }));
  });
}

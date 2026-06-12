/**
 * Shared filter/sort URL conventions for collection-style routes.
 *
 * The old skeleton SortFilter/FiltersDrawer/SortMenu UI was removed — the
 * collection route renders its own toolbar. What remains is the URL contract:
 * `filter.<key>=<json>` params map to Storefront API ProductFilters in the
 * collection loader, and `sort=<SortParam>` selects the sort order.
 */

export type SortParam =
  | 'price-low-high'
  | 'price-high-low'
  | 'best-selling'
  | 'newest'
  | 'featured';

export const FILTER_URL_PREFIX = 'filter.';

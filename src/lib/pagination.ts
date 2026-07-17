export const DEFAULT_PAGE_SIZE = 500;

export type PaginationMeta = {
  total_count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
};

export type PaginatedApiResponse<T> = {
  ok: true;
  data: T[];
  meta: PaginationMeta;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

type LegacyPaginatedResponse<T> = {
  ok?: boolean;
  data?: T[];
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  meta?: Partial<PaginationMeta>;
};

export function buildPaginationParams(
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams({
    limit: String(perPage),
    ...extra,
  });

  if (page > 1) {
    params.set("page", String(page));
  }

  return params;
}

export function createPaginationMeta(
  totalCount: number,
  perPage: number,
  currentPage = 1,
): PaginationMeta {
  const safePerPage = Math.max(1, perPage);
  const totalPages = Math.max(1, Math.ceil(totalCount / safePerPage));

  return {
    total_count: totalCount,
    per_page: safePerPage,
    current_page: Math.min(Math.max(1, currentPage), totalPages),
    total_pages: totalPages,
  };
}

export function parsePaginatedResponse<T>(json: unknown): PaginatedResult<T> {
  const response = json as LegacyPaginatedResponse<T>;
  const data = response.data ?? [];

  if (response.meta) {
    const perPage =
      response.meta.per_page ?? (data.length || DEFAULT_PAGE_SIZE);
    const totalCount = response.meta.total_count ?? data.length;
    const currentPage = response.meta.current_page ?? 1;

    return {
      data,
      meta: createPaginationMeta(totalCount, perPage, currentPage),
    };
  }

  // Legacy flat pagination shape (e.g. call-fraud):
  // { data, total, page, limit, pages }
  if (
    typeof response.total === "number" ||
    typeof response.limit === "number" ||
    typeof response.page === "number"
  ) {
    const perPage = response.limit ?? (data.length || DEFAULT_PAGE_SIZE);
    const totalCount = response.total ?? data.length;
    const currentPage = response.page ?? 1;

    return {
      data,
      meta: createPaginationMeta(totalCount, perPage, currentPage),
    };
  }

  const totalCount =
    typeof response.count === "number" ? response.count : data.length;
  const perPage = data.length > 0 ? data.length : DEFAULT_PAGE_SIZE;

  return {
    data,
    meta: createPaginationMeta(totalCount, perPage, 1),
  };
}

export function getPaginationRange(meta: PaginationMeta, rowCount: number) {
  if (rowCount === 0) {
    return { start: 0, end: 0 };
  }

  const start = (meta.current_page - 1) * meta.per_page + 1;
  const end = start + rowCount - 1;

  return { start, end };
}

export function getPageNumbers(currentPage: number, totalPages: number) {
  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

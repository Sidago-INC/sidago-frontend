import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { filterSelectOptions } from "@/lib/select-search";
import { useDebouncedValue } from "@/lib/use-debounced-value";

type PaginatedFetchResult<T> = {
  data: T[];
  count: number;
};

type UsePaginatedSelectSourceOptions<
  T,
  O extends { label: string; value: string | number },
> = {
  queryKeyPrefix: string;
  pageSize?: number;
  fetchPage: (params: {
    limit: number;
    page: number;
    search?: string;
  }) => Promise<PaginatedFetchResult<T>>;
  fetchSearchPage?: (params: {
    limit: number;
    page: number;
    search: string;
  }) => Promise<PaginatedFetchResult<T>>;
  searchPageSize?: number;
  buildOptions: (items: T[]) => O[];
  extraOptions?: O[];
  enabled?: boolean;
};

export function usePaginatedSelectSource<
  T,
  O extends { label: string; value: string | number },
>({
  queryKeyPrefix,
  pageSize = 50,
  fetchPage,
  fetchSearchPage,
  searchPageSize,
  buildOptions,
  extraOptions = [],
  enabled = true,
}: UsePaginatedSelectSourceOptions<T, O>) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const remoteLimit = searchPageSize ?? pageSize;

  const getNextPageParam = useCallback(
    (lastPage: PaginatedFetchResult<T>, allPages: PaginatedFetchResult<T>[]) => {
      const loaded = allPages.reduce(
        (total, page) => total + page.data.length,
        0,
      );

      if (lastPage.count > 0 && loaded < lastPage.count) {
        return allPages.length + 1;
      }

      if (lastPage.data.length >= pageSize) {
        return allPages.length + 1;
      }

      return undefined;
    },
    [pageSize],
  );

  const getNextSearchPageParam = useCallback(
    (lastPage: PaginatedFetchResult<T>, allPages: PaginatedFetchResult<T>[]) => {
      const loaded = allPages.reduce(
        (total, page) => total + page.data.length,
        0,
      );

      if (lastPage.count > 0 && loaded < lastPage.count) {
        return allPages.length + 1;
      }

      if (lastPage.data.length >= remoteLimit) {
        return allPages.length + 1;
      }

      return undefined;
    },
    [remoteLimit],
  );

  const browseQuery = useInfiniteQuery({
    queryKey: [queryKeyPrefix, "browse", pageSize],
    enabled,
    queryFn: ({ pageParam = 1 }) =>
      fetchPage({ limit: pageSize, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam,
    staleTime: 5 * 60_000,
  });

  const browseItems = useMemo(
    () => browseQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [browseQuery.data],
  );

  const browseOptions = useMemo(
    () => buildOptions(browseItems),
    [browseItems, buildOptions],
  );

  const localFilteredOptions = useMemo(
    () => filterSelectOptions(browseOptions, debouncedSearch),
    [browseOptions, debouncedSearch],
  );

  const remoteFetch = fetchSearchPage ?? fetchPage;

  const shouldRemoteSearch = fetchSearchPage
    ? Boolean(debouncedSearch.trim())
    : Boolean(debouncedSearch.trim()) && localFilteredOptions.length === 0;

  const remoteQuery = useInfiniteQuery({
    queryKey: [
      queryKeyPrefix,
      "search",
      debouncedSearch,
      remoteLimit,
      Boolean(fetchSearchPage),
    ],
    enabled: enabled && shouldRemoteSearch,
    queryFn: ({ pageParam = 1 }) =>
      remoteFetch({
        limit: remoteLimit,
        page: pageParam,
        search: debouncedSearch.trim(),
      }),
    initialPageParam: 1,
    getNextPageParam: getNextSearchPageParam,
    staleTime: 60_000,
  });

  const remoteItems = useMemo(
    () => remoteQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [remoteQuery.data],
  );

  const options = useMemo(() => {
    const baseOptions = shouldRemoteSearch
      ? buildOptions(remoteItems)
      : debouncedSearch.trim()
        ? localFilteredOptions
        : browseOptions;

    if (extraOptions.length === 0) {
      return baseOptions;
    }

    const seen = new Set(baseOptions.map((option) => String(option.value)));
    const merged = [...baseOptions];

    for (const option of extraOptions) {
      const key = String(option.value);
      if (seen.has(key)) continue;
      merged.unshift(option);
      seen.add(key);
    }

    return merged;
  }, [
    browseOptions,
    buildOptions,
    debouncedSearch,
    extraOptions,
    localFilteredOptions,
    remoteItems,
    shouldRemoteSearch,
  ]);

  const activeQuery = shouldRemoteSearch ? remoteQuery : browseQuery;

  return {
    options,
    browseItems,
    remoteItems,
    searchInput,
    onSearchChange: setSearchInput,
    onLoadMore: () => {
      if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
        void activeQuery.fetchNextPage();
      }
    },
    hasMore: Boolean(activeQuery.hasNextPage),
    isLoadingMore: activeQuery.isFetchingNextPage,
    isSearching:
      browseQuery.isLoading ||
      (shouldRemoteSearch &&
        remoteQuery.isFetching &&
        !remoteQuery.isFetchingNextPage),
    isLoading: browseQuery.isLoading,
  };
}

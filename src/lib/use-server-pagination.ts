import { useCallback, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

export function useServerPagination(initialPerPage = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(initialPerPage);

  const setPerPage = useCallback((nextPerPage: number) => {
    setPerPageState(nextPerPage);
    setPage(1);
  }, []);

  return {
    page,
    perPage,
    setPage,
    setPerPage,
  };
}

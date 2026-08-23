
import { ActivityTimeline } from "@/components/ui/ActivityTimeline";
import {
  useCompanyRevisionHistory,
  useLeadRevisionHistory,
} from "@/features/backoffice-shared/use-revision-history";
import { Hourglass, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";

type RevisionsProps = {
  leadId?: string;
  companyId?: string;
};

export default function Revisions({ leadId, companyId }: RevisionsProps) {
  const [open, setOpen] = useState(false);
  const targetId = leadId ?? companyId;
  const isCompanyRevision = Boolean(companyId && !leadId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const leadRevisionQuery = useLeadRevisionHistory(
    isCompanyRevision ? undefined : leadId,
    { enabled: open },
  );
  const companyRevisionQuery = useCompanyRevisionHistory(
    isCompanyRevision ? companyId : undefined,
    { enabled: open },
  );
  const revisionQuery = isCompanyRevision
    ? companyRevisionQuery
    : leadRevisionQuery;

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    isError,
    hasNextPage,
    fetchNextPage,
  } = revisionQuery;

  const activities = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );
  const isInitialLoading = isLoading || (isFetching && activities.length === 0);
  const hasMore = Boolean(hasNextPage);

  const tryLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    setOpen(false);
  }, [targetId]);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;

    if (!open || !root || !sentinel || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          tryLoadMore();
        }
      },
      { root, rootMargin: "64px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activities.length, hasMore, isFetchingNextPage, open, tryLoadMore]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distanceFromBottom < 48) {
      tryLoadMore();
    }
  };

  return (
    <div className="w-full">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={!targetId}
          className="flex w-full cursor-pointer items-center justify-between border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          <div className="flex items-center gap-3">
            <Hourglass size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              See revision history
            </span>
          </div>
        </button>
      )}

      {open && (
        <div className="overflow-visible border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-700">
            <div className="text-xs">Revision History</div>

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="max-h-80 space-y-3 overflow-y-auto p-4"
          >
            {!targetId ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Revision history is unavailable for this record.
              </p>
            ) : isInitialLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading revision history…
              </p>
            ) : isError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load revision history.
              </p>
            ) : activities.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No revision history yet.
              </p>
            ) : (
              <ActivityTimeline activities={activities} />
            )}

            {hasMore && (
              <div ref={loadMoreSentinelRef} className="h-px" aria-hidden="true" />
            )}

            {isFetchingNextPage && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Loading more…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

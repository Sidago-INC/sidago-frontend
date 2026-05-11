

import { type NavigationItem } from "@/lib/navigation";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import clsx from "clsx";

export type Props = {
  item: NavigationItem;
  isCollapsed: boolean;
  currentPath: string;
  currentSearch?: string;
  allowLabelWrap?: boolean;
  depth?: number;
  itemKey?: string;
};

function normalizeQueryString(value: string) {
  const params = new URLSearchParams(value);
  const entries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return new URLSearchParams(entries).toString();
}

function hrefMatchesCurrent(
  href: string | undefined,
  pathname: string,
  currentSearch = "",
) {
  if (!href) {
    return false;
  }

  const [hrefPath, hrefQuery = ""] = href.split("?");

  if (hrefPath !== pathname) {
    return false;
  }

  if (!hrefQuery) {
    return true;
  }

  return (
    normalizeQueryString(hrefQuery) === normalizeQueryString(currentSearch)
  );
}

function itemMatchesPath(
  item: NavigationItem,
  pathname: string,
  currentSearch = "",
): boolean {
  if (hrefMatchesCurrent(item.href, pathname, currentSearch)) {
    return true;
  }

  return (
    item.children?.some((child) =>
      itemMatchesPath(child, pathname, currentSearch),
    ) ?? false
  );
}

export const SidebarItem = ({
  item,
  isCollapsed,
  currentPath,
  currentSearch = "",
  allowLabelWrap = false,
  depth = 0,
  itemKey = "",
}: Props) => {
  const Icon = item.icon;
  const hasChildren = Boolean(item.children?.length);
  const isActive = hrefMatchesCurrent(item.href, currentPath, currentSearch);
  const isBranchActive = useMemo(
    () => itemMatchesPath(item, currentPath, currentSearch),
    [currentPath, currentSearch, item],
  );
  const resolvedKey = itemKey || item.href || item.label;
  const routeSignature = `${resolvedKey}::${currentPath}?${currentSearch}`;
  const [manualOpenState, setManualOpenState] = useState<{
    routeSignature: string;
    value: boolean | null;
  }>({
    routeSignature,
    value: null,
  });
  const isOpen =
    manualOpenState.routeSignature === routeSignature
      ? (manualOpenState.value ?? isBranchActive)
      : isBranchActive;
  const showIcon = depth === 0;
  const labelClassName =
    depth === 0
      ? "text-[0.875rem]"
      : depth === 1
        ? "text-[0.8125rem]"
        : "text-xs";

  const baseClasses = clsx(
    "group flex w-full items-center rounded-xl border p-2 transition-all duration-300",
    isCollapsed ? "justify-center" : "justify-start",
    isActive
      ? "border-transparent font-bold text-indigo-700 dark:text-indigo-300"
      : isBranchActive
        ? "border-transparent text-indigo-600 dark:text-indigo-300"
        : "border-transparent text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-indigo-300",
  );

  const content = (
    <div className="flex min-w-0 flex-1 items-center justify-between overflow-hidden">
      <div className="flex min-w-0 items-center gap-3 overflow-hidden">
        {showIcon ? (
          <Icon
            size={18}
            className={clsx(
              "shrink-0",
              isActive || isBranchActive
                ? "text-indigo-700 dark:text-indigo-300"
                : "group-hover:text-indigo-700 dark:group-hover:text-indigo-300",
            )}
          />
        ) : null}
        {!isCollapsed ? (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
              "min-w-0 text-left tracking-wide",
              isActive ? "font-bold" : "font-semibold",
              labelClassName,
              allowLabelWrap
                ? "whitespace-normal wrap-break-words leading-snug"
                : "truncate",
            )}
          >
            {item.label}
          </motion.span>
        ) : null}
      </div>
      {!isCollapsed && hasChildren ? (
        <ChevronDown
          size={16}
          className={clsx(
            "shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      ) : null}
    </div>
  );

  return (
    <div className={clsx("space-y-1", !isCollapsed && depth > 0 && "ml-4")}>
      {hasChildren ? (
        <button
          type="button"
          onClick={() => {
            if (!isCollapsed) {
              setManualOpenState((current) => ({
                routeSignature,
                value:
                  current.routeSignature === routeSignature
                    ? !(current.value ?? isBranchActive)
                    : !isBranchActive,
              }));
            }
          }}
          title={item.label}
          className={clsx(baseClasses, "cursor-pointer")}
        >
          {content}
        </button>
      ) : item.href ? (
        <Link to={item.href} title={item.label} className={baseClasses}>
          {content}
        </Link>
      ) : (
        <div title={item.label} className={baseClasses}>
          {content}
        </div>
      )}

      {!isCollapsed && hasChildren && isOpen ? (
        <div className="space-y-1">
          {item.children!.map((child, index) => (
            <SidebarItem
              key={`${resolvedKey}-${child.href ?? child.label}-${index}`}
              item={child}
              isCollapsed={false}
              currentPath={currentPath}
              currentSearch={currentSearch}
              allowLabelWrap={allowLabelWrap}
              depth={depth + 1}
              itemKey={`${resolvedKey}-${child.label}-${index}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

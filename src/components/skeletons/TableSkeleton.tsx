

import React from "react";

type Props = {
  rows?: number;
  columns?: number;
};

export function TableSkeleton({ rows = 5, columns = 4 }: Props) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
        <thead className="bg-gray-100 dark:bg-slate-800">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="p-4">
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-slate-700" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

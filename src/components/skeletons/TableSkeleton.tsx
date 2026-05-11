

import React from "react";

type Props = {
  rows?: number;
  columns?: number;
};

export function TableSkeleton({ rows = 5, columns = 4 }: Props) {
  return (
    <>
      {/* 🔹 Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full bg-white rounded-2xl shadow overflow-hidden">
          {/* Header */}
          <thead className="bg-gray-100">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-4">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-t">
                {Array.from({ length: columns }).map((_, j) => (
                  <td key={j} className="p-4">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

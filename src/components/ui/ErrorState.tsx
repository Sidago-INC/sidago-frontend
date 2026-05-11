

import React from "react";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import { RefreshCw } from "lucide-react";

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const message = getErrorMessage(error);

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 space-y-4">
      <h2 className="text-xl font-semibold text-red-600">{title}</h2>

      <p className="text-sm text-gray-600 whitespace-pre-line max-w-md">
        {message}
      </p>

      {onRetry && (
        <Button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                    font-medium text-white
                    bg-black hover:bg-black/90
                    transition-all duration-200
                    active:scale-95
                    shadow-sm hover:shadow-md
                    focus:outline-none ring-0"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  );
}

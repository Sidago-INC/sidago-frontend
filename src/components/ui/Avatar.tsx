

import React, { useState } from "react";
import clsx from "clsx";
import { LucideIcon } from "lucide-react";

type AvatarProps = {
  name?: string;
  src?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  icon?: LucideIcon;
};

export function Avatar({
  name = "",
  src,
  alt,
  className,
  priority = false,
  icon,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const Icon = icon;

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const showImage = Boolean(src) && !imgError;

  return (
    <div
      aria-label={alt || name || "avatar"}
      className={clsx(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full",
        "h-8 w-8 text-xs font-semibold",
        "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
        className,
      )}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt || name || "avatar"}
          loading={priority ? "eager" : "lazy"}
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

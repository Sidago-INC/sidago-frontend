

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";

export type DrawerDirection = "left" | "right" | "top" | "bottom";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Slide direction — controls which edge the drawer enters from. */
  direction?: DrawerDirection;
  /**
   * Panel size. For left/right this is the width; for top/bottom this is the height.
   * Accepts any CSS value: "400px", "50%", "30vw", "80vh", etc.
   * @default "400px"
   */
  size?: string;
  /** Fully custom header content. A close button is always appended on the right. */
  header?: ReactNode;
  /** Optional footer rendered below the scrollable body. */
  footer?: ReactNode;
  children: ReactNode;
  /** Close when clicking the overlay backdrop. @default true */
  closeOnOverlay?: boolean;
  /** Extra className on the panel element. */
  className?: string;
  /**
   * CSS z-index for the panel. Overlay is rendered at zIndex − 1.
   * DrawerProvider manages this automatically for stacked drawers.
   * @default 200
   */
  zIndex?: number;
}

// ─── animation variants ────────────────────────────────────────────────────
const slide: Record<
  DrawerDirection,
  { initial: Record<string, string>; exit: Record<string, string> }
> = {
  left: { initial: { x: "-100%" }, exit: { x: "-100%" } },
  right: { initial: { x: "100%" }, exit: { x: "100%" } },
  top: { initial: { y: "-100%" }, exit: { y: "-100%" } },
  bottom: { initial: { y: "100%" }, exit: { y: "100%" } },
};

// ─── CSS position helpers ───────────────────────────────────────────────────
const anchor: Record<DrawerDirection, string> = {
  left: "inset-y-0 left-0",
  right: "inset-y-0 right-0",
  top: "inset-x-0 top-0",
  bottom: "inset-x-0 bottom-0",
};

export function Drawer({
  isOpen,
  onClose,
  direction = "right",
  size = "400px",
  header,
  footer,
  children,
  closeOnOverlay = true,
  className,
  zIndex = 200,
}: DrawerProps) {
  // ── scroll lock ─────────────────────────────────────────────────────────
  // Reference-counted so stacked drawers don't fight each other.
  useEffect(() => {
    if (!isOpen) return;
    const count = parseInt(document.body.dataset.openDrawers ?? "0", 10);
    document.body.dataset.openDrawers = String(count + 1);
    document.body.style.overflow = "hidden";
    return () => {
      const next = Math.max(
        0,
        parseInt(document.body.dataset.openDrawers ?? "1", 10) - 1,
      );
      document.body.dataset.openDrawers = String(next);
      if (next === 0) document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (typeof window === "undefined") return null;

  const isHorizontal = direction === "left" || direction === "right";
  const sizeStyle: React.CSSProperties = isHorizontal
    ? { width: size, maxWidth: "100vw" }
    : { height: size, maxHeight: "100vh" };

  const { initial, exit } = slide[direction];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ─────────────────────────────────────────────── */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ zIndex: zIndex - 1 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeOnOverlay ? onClose : undefined}
          />

          {/* ── Panel ────────────────────────────────────────────────── */}
          <motion.div
            key="drawer-panel"
            initial={initial}
            animate={{ x: 0, y: 0 }}
            exit={exit}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ ...sizeStyle, zIndex }}
            className={clsx(
              "fixed flex flex-col bg-white shadow-2xl dark:bg-gray-900",
              anchor[direction],
              className,
            )}
          >
            {/* Header — always present; close button is always on the right */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div className="min-w-0 flex-1">{header}</div>
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="ml-3 flex h-7 w-7 shrink-0 items-center cursor-pointer justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>

            {/* Footer — only rendered when provided */}
            {footer && (
              <div className="relative z-10 shrink-0 overflow-visible border-t border-gray-200 dark:border-gray-700">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

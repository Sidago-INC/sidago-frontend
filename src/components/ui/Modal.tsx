
import { AnimatePresence, motion, Variants } from "framer-motion";
import { X } from "lucide-react";
import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

export type ModalDirection = "top" | "bottom" | "left" | "right" | "center";

type ModalAction = {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
};

type ModalProps = {
  isOpen: boolean;
  title?: string;
  description?: string;
  direction?: ModalDirection;
  icon?: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
};

const directionVariants: Record<ModalDirection, Variants> = {
  top: {
    initial: { opacity: 0, y: -80 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -80 },
  },
  bottom: {
    initial: { opacity: 0, y: 80 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 80 },
  },
  left: {
    initial: { opacity: 0, x: -80 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -80 },
  },
  right: {
    initial: { opacity: 0, x: 80 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 80 },
  },
  center: {
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.92 },
  },
};

function actionClass(variant: "primary" | "secondary" = "primary") {
  if (variant === "secondary") {
    return "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";
  }

  return "bg-sky-600 text-white hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400";
}

export function Modal({
  isOpen,
  title,
  description,
  direction = "center",
  icon,
  children,
  onClose,
  primaryAction,
  secondaryAction,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const node = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            variants={directionVariants[direction]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-linear-to-r from-sky-500 via-indigo-500 to-cyan-500" />

            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  {icon && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300">
                      {icon}
                    </div>
                  )}

                  <div className="min-w-0">
                    {title && (
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {title}
                      </h3>
                    )}

                    {description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </Button>
              </div>

              {children && (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {children}
                </div>
              )}

              {(secondaryAction || primaryAction) && (
                <div className="mt-6 flex justify-end gap-3">
                  {secondaryAction && (
                    <Button
                      onClick={secondaryAction.onClick}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${actionClass(
                        secondaryAction.variant ?? "secondary",
                      )}`}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}

                  {primaryAction && (
                    <Button
                      onClick={primaryAction.onClick}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold ${actionClass(
                        primaryAction.variant,
                      )}`}
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Portal to document.body so the modal escapes any ancestor that creates a
  // containing block for fixed positioning (transform, filter, will-change, etc).
  // Without this, opening a modal from inside e.g. the header bar clips the
  // modal to that ancestor instead of the viewport.
  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}



import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState } from "react";

interface DropdownPanelProps {
  trigger: (toggle: () => void) => ReactNode;
  children: ReactNode;
  panelClassName?: string;
}

export function DropdownPanel({
  trigger,
  children,
  panelClassName,
}: DropdownPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return (
    <div className="relative">
      {trigger(toggle)}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={close} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className={panelClassName}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

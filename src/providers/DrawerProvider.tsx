
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Drawer, DrawerDirection } from "@/components/ui/Drawer";

// ─── Public API types ─────────────────────────────────────────────────────

export interface DrawerConfig {
  /** Stable id — lets you close a specific drawer by id. Auto-generated if omitted. */
  id?: string;
  direction?: DrawerDirection;
  /**
   * Width (left/right) or height (top/bottom). Any CSS value.
   * @default "400px"
   */
  size?: string;
  /** Fully custom header content. */
  header?: ReactNode;
  /** Optional footer rendered below the scrollable body. */
  footer?: ReactNode;
  children: ReactNode;
  /** Close when clicking the backdrop. @default true */
  closeOnOverlay?: boolean;
  /** Extra className on the panel. */
  className?: string;
  /** Called when the drawer closes for any reason. */
  onClose?: () => void;
}

export interface DrawerContextValue {
  /** Push a new drawer onto the stack. Returns the assigned id. */
  open: (config: DrawerConfig) => string;
  /** Close a specific drawer by id, or the topmost open one if omitted. */
  close: (id?: string) => void;
  /** Immediately close every open drawer. */
  closeAll: () => void;
}

// ─── Internal ─────────────────────────────────────────────────────────────

interface DrawerEntry {
  id: string;
  config: DrawerConfig;
  isOpen: boolean;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

const BASE_Z = 200;
const Z_STEP = 10;
const EXIT_MS = 400;

// ─── Provider ─────────────────────────────────────────────────────────────

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<DrawerEntry[]>([]);

  const open = useCallback((config: DrawerConfig): string => {
    const id =
      config.id ??
      `drawer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setStack((prev) => [...prev, { id, config, isOpen: true }]);
    return id;
  }, []);

  const close = useCallback((id?: string) => {
    // Mark target as closing → triggers exit animation in <Drawer>
    setStack((prev) => {
      const targetId = id ?? [...prev].reverse().find((e) => e.isOpen)?.id;
      if (!targetId) return prev;
      return prev.map((e) => (e.id === targetId ? { ...e, isOpen: false } : e));
    });
    // Remove all closed entries after animation finishes
    setTimeout(() => {
      setStack((prev) => prev.filter((e) => e.isOpen));
    }, EXIT_MS);
  }, []);

  const closeAll = useCallback(() => {
    setStack((prev) => prev.map((e) => ({ ...e, isOpen: false })));
    setTimeout(() => setStack([]), EXIT_MS);
  }, []);

  return (
    <DrawerContext.Provider value={{ open, close, closeAll }}>
      {children}

      {stack.map((entry, index) => (
        <Drawer
          key={entry.id}
          isOpen={entry.isOpen}
          onClose={() => {
            entry.config.onClose?.();
            close(entry.id);
          }}
          direction={entry.config.direction}
          size={entry.config.size}
          header={entry.config.header}
          footer={entry.config.footer}
          closeOnOverlay={entry.config.closeOnOverlay}
          className={entry.config.className}
          zIndex={BASE_Z + index * Z_STEP}
        >
          {entry.config.children}
        </Drawer>
      ))}
    </DrawerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useDrawer(): DrawerContextValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used within <DrawerProvider>");
  return ctx;
}

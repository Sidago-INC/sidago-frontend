```ts
"use client";

import { useDrawer } from "@/providers/DrawerProvider";
import type { DrawerDirection } from "./Drawer";

// ─── Nested drawer content ────────────────────────────────────────────────
// Lives inside an open drawer; uses useDrawer to push another one on the stack.

function NestedDrawerContent({ depth }: { depth: number }) {
  const { open } = useDrawer();

  const directions: DrawerDirection[] = ["right", "left", "bottom", "top"];
  const next = directions[depth % directions.length];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        This is drawer level <strong className="text-gray-900 dark:text-gray-100">{depth}</strong>.
        You can keep stacking — each new drawer renders on top with an
        increasing z-index.
      </p>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Open another drawer from inside this one
        </p>
        <button
          onClick={() =>
            open({
              direction: next,
              size: next === "top" || next === "bottom" ? "260px" : "380px",
              header: (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
                    Drawer level {depth + 1}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    Stacked drawer — {next}
                  </p>
                </div>
              ),
              footer: (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Drawer {depth + 1} of {depth + 1} open
                </p>
              ),
              children: <NestedDrawerContent depth={depth + 1} />,
            })
          }
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          Open drawer from {next} ↗
        </button>
      </div>

      <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
        {Array.from({ length: 6 }, (_, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
          >
            Row item {i + 1} — drawer level {depth}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Direction picker inside the main drawer ─────────────────────────────

function DirectionPicker() {
  const { open } = useDrawer();

  const options: { direction: DrawerDirection; size: string; label: string }[] = [
    { direction: "right",  size: "420px", label: "Right →" },
    { direction: "left",   size: "420px", label: "← Left" },
    { direction: "bottom", size: "320px", label: "↑ Bottom" },
    { direction: "top",    size: "320px", label: "↓ Top" },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Pick a direction to open a stacked drawer from that edge of the screen.
        All drawers share the same z-index stack — backdrop of each one dims
        everything beneath it.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {options.map(({ direction, size, label }) => (
          <button
            key={direction}
            onClick={() =>
              open({
                direction,
                size,
                header: (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
                      Level 2
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {label} drawer
                    </p>
                  </div>
                ),
                footer: (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Opens from the {direction} edge
                  </p>
                ),
                children: <NestedDrawerContent depth={2} />,
              })
            }
            className="flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
          >
            {label}
          </button>
        ))}
      </div>

      <NestedDrawerContent depth={1} />
    </div>
  );
}

// ─── Public component — drop this anywhere to demo the drawer ─────────────

export function DrawerDemo() {
  const { open, closeAll } = useDrawer();

  const openMainDrawer = () =>
    open({
      direction: "right",
      size: "480px",
      header: (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
            Drawer demo
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Main drawer — level 1
          </p>
        </div>
      ),
      footer: (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Click a direction below to stack another drawer.
          </p>
          <button
            onClick={closeAll}
            className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Close all
          </button>
        </div>
      ),
      children: <DirectionPicker />,
    });

  return (
    <button
      onClick={openMainDrawer}
      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
    >
      Open Drawer Demo
    </button>
  );
}
```

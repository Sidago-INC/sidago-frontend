import { formatPhone } from "../_lib/format";

/**
 * A grid cell: the lead's preferred number plus "+N" when it has more. Grids get
 * only a count from the API, never the list - the drawer shows the numbers.
 *
 * `usable`, when given, is how many of them can still be dialled; shown on the
 * Fix queue, where "0 usable" is why the lead is there.
 */
export function PhoneWithCount({
  phone,
  count,
  usable,
}: {
  phone: string | null | undefined;
  count?: number | null;
  usable?: number | null;
}) {
  const extra = (count ?? 0) - 1;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{formatPhone(phone) || "-"}</span>
      {extra > 0 ? (
        <span
          title={`${count} numbers on this lead`}
          className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          +{extra}
        </span>
      ) : null}
      {usable !== undefined && usable !== null && (count ?? 0) > 0 ? (
        <span
          title="Numbers that can still be dialled"
          className={
            usable === 0
              ? "rounded bg-red-50 px-1.5 py-px text-[10px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300"
              : "rounded bg-emerald-50 px-1.5 py-px text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }
        >
          {usable} usable
        </span>
      ) : null}
    </span>
  );
}

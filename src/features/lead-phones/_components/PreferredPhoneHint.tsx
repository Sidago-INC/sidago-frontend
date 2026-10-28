import { PREFERRED_PHONE_HINT } from "../_lib/format";

/**
 * The note that goes right under a "Preferred Phone" field. The drawers each
 * carry their own EditableField row, so this sits beside the row rather than
 * inside it.
 */
export function PreferredPhoneHint() {
  return (
    <p className="-mt-1 pb-1 text-right text-[10px] leading-tight text-slate-400 dark:text-slate-500">
      {PREFERRED_PHONE_HINT}
    </p>
  );
}

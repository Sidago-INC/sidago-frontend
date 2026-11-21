/**
 * The result codes an agent can log today, mirroring
 * `sidago-backend/src/agent-calls/call-result-mapping.constant.ts`.
 *
 * `call_logs.result_code` also holds historical values from the Airtable era
 * and from the dialer ("Left VM", "Unavailable", "Force GENERAL",
 * "DIAL_INITIATED", …). Those are kept in the data but are not offered as
 * filter choices — a picker should list what the system produces, not every
 * string that has ever landed in the column.
 */
export const CALL_RESULT_VALUES = [
  "No Answer",
  "Left Message",
  "Bad Number",
  "Interested",
  "Interested Again",
  "Call Lead Back",
  "Not Interested",
  "DNC",
  "Contract Closed",
] as const;

export type CallResult = (typeof CALL_RESULT_VALUES)[number];

export const CALL_RESULT_OPTIONS: { value: string; label: string }[] =
  CALL_RESULT_VALUES.map((value) => ({ value, label: value }));

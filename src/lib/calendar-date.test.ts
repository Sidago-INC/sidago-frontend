import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCalendarDate, parseCalendarDate } from "./calendar-date.ts";

// Run under several TZ values (see the "test" script / TZ override in the PR)
// so the same assertions cover UTC, UTC+6, US and the extremes.

test("a selected calendar day survives a save and reload in every day of 2026", () => {
  // Covers the US and EU daylight-saving changeover dates.
  for (let month = 0; month < 12; month++) {
    const last = new Date(2026, month + 1, 0).getDate();
    for (let day = 1; day <= last; day++) {
      const iso = `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const picked = parseCalendarDate(iso);
      assert.ok(picked, `parse ${iso}`);
      assert.equal(formatCalendarDate(picked), iso, `round trip ${iso}`);
    }
  }
});

test("the reported case keeps its day: 2026-12-20 is not saved as 2026-12-19", () => {
  const picked = parseCalendarDate("2026-12-20");
  assert.equal(picked?.getDate(), 20);
  assert.equal(formatCalendarDate(picked), "2026-12-20");
});

test("a date picked at any time of day formats to its own calendar day", () => {
  // Date pickers can return local midnight or the current time of day.
  const morning = new Date(2026, 11, 20, 0, 5);
  const evening = new Date(2026, 11, 20, 23, 55);
  assert.equal(formatCalendarDate(morning), "2026-12-20");
  assert.equal(formatCalendarDate(evening), "2026-12-20");
});

test("impossible calendar dates are rejected, not rolled over", () => {
  assert.equal(parseCalendarDate("2026-02-31"), null);
  assert.equal(parseCalendarDate("2026-13-01"), null);
});

test("empty and invalid input", () => {
  assert.equal(parseCalendarDate(""), null);
  assert.equal(parseCalendarDate("   "), null);
  assert.equal(parseCalendarDate("not a date"), null);
  assert.equal(formatCalendarDate(null), "");
  assert.equal(formatCalendarDate(new Date("nope")), "");
});

test("non-calendar values fall back to Date parsing as before", () => {
  const parsed = parseCalendarDate("2026-12-20T10:00:00Z");
  assert.ok(parsed);
  assert.equal(parsed.getTime(), Date.parse("2026-12-20T10:00:00Z"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { getHistoryEntries, sortNewestFirst } from "./history.ts";
import type { HistoryEntry } from "./apiTypes.ts";

const entry = (id: string, calledAt: string, notes: string | null = null): HistoryEntry => ({
  id,
  calledAt,
  notes,
  resultCode: "No Answer",
  agentName: "Agent",
  durationSeconds: null,
  source: "manual",
  mightyCallId: null,
  phoneDialled: null,
});
const ids = (entries: HistoryEntry[]) => entries.map((e) => e.id).join(",");

test("array history: sortNewestFirst orders newest first", () => {
  const list = [entry("old", "2026-01-05T10:00:00Z"), entry("new", "2026-03-01T10:00:00Z"), entry("mid", "2026-02-10T10:00:00Z")];
  assert.equal(ids(sortNewestFirst(getHistoryEntries(list))), "new,mid,old");
});

test("sortNewestFirst does not mutate its input", () => {
  const list = [entry("a", "2026-01-01T00:00:00Z"), entry("b", "2026-02-01T00:00:00Z")];
  const before = ids(list);
  sortNewestFirst(list);
  assert.equal(ids(list), before);
});

test("brand-keyed history: only the requested brand, sorted", () => {
  const keyed = {
    svg: [entry("svg-old", "2026-01-01T00:00:00Z"), entry("svg-new", "2026-05-01T00:00:00Z")],
    benton: [entry("benton", "2026-09-01T00:00:00Z", "other brand note")],
  };
  const svg = sortNewestFirst(getHistoryEntries(keyed, "svg"));
  assert.equal(ids(svg), "svg-new,svg-old");
  assert.ok(!svg.some((e) => e.id === "benton"), "must not mix in another brand");
});

test("brand-keyed history: brand lookup ignores case", () => {
  const keyed = { SVG: [entry("a", "2026-01-01T00:00:00Z")] };
  assert.equal(ids(getHistoryEntries(keyed, "svg")), "a");
});

test("merged history (no brand): all brands, newest first", () => {
  const keyed = {
    svg: [entry("svg", "2026-01-01T00:00:00Z")],
    benton: [entry("benton", "2026-09-01T00:00:00Z")],
  };
  assert.equal(ids(sortNewestFirst(getHistoryEntries(keyed))), "benton,svg");
});

test("invalid timestamps are kept and sort last without throwing", () => {
  const list = [entry("bad", "not-a-date"), entry("ok", "2026-02-01T00:00:00Z")];
  assert.equal(ids(sortNewestFirst(getHistoryEntries(list))), "ok,bad");
});

test("entries with a missing timestamp are dropped by the parser, as before", () => {
  const list = [{ ...entry("missing", ""), calledAt: "" }, entry("ok", "2026-02-01T00:00:00Z")];
  assert.equal(ids(getHistoryEntries(list)), "ok");
});

test("equal timestamps keep their original order", () => {
  const same = "2026-04-04T12:00:00Z";
  const list = [entry("first", same), entry("second", same)];
  assert.equal(ids(sortNewestFirst(list)), "first,second");
});

test("empty and null history", () => {
  assert.equal(getHistoryEntries(null).length, 0);
  assert.equal(getHistoryEntries({}).length, 0);
});

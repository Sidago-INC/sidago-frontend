import { test } from "node:test";
import assert from "node:assert/strict";
import {
  followUpToSubmit,
  notesAfterSave,
  notesToSubmit,
} from "./outcomePayload.ts";

test("notes: typed text is trimmed and sent", () => {
  assert.equal(notesToSubmit("  Called back, asked for pricing  "), "Called back, asked for pricing");
});

test("notes: empty and whitespace-only text sends nothing", () => {
  assert.equal(notesToSubmit(""), undefined);
  assert.equal(notesToSubmit("   \n\t "), undefined);
});

test("notes: after a save the box clears if it still holds the submitted text", () => {
  assert.equal(notesAfterSave("New note", "New note"), "");
  assert.equal(notesAfterSave("  New note  ", "New note"), "");
});

test("notes: text typed while the request was in flight is kept", () => {
  assert.equal(notesAfterSave("Second note typed later", "First note"), "Second note typed later");
});

test("notes: a box with nothing submitted is left as typed", () => {
  assert.equal(notesAfterSave("draft", ""), "draft");
  assert.equal(notesAfterSave("", ""), "");
});

test("follow-up: an unchanged stored date is not submitted", () => {
  assert.equal(followUpToSubmit("2026-12-20", "2026-12-20"), undefined);
});

test("follow-up: a changed date is submitted", () => {
  assert.equal(followUpToSubmit("2026-12-20", "2026-12-31"), "2026-12-20");
  assert.equal(followUpToSubmit("2026-12-20", null), "2026-12-20");
});

test("follow-up: no stored date and no new date sends nothing", () => {
  assert.equal(followUpToSubmit("", null), undefined);
  assert.equal(followUpToSubmit("", undefined), undefined);
});

test("follow-up: a cleared date sends nothing (clear contract not settled)", () => {
  assert.equal(followUpToSubmit("", "2026-12-31"), undefined);
});

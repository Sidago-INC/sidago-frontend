import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diffDraftPatch } from "./draft-patch.ts";

describe("diffDraftPatch", () => {
  it("sends everything when nothing has been saved yet", () => {
    assert.deepEqual(
      diffDraftPatch({}, { level2AgentName: "Mariz Cabido", resultUpdate: "Force Fix" }),
      { level2AgentName: "Mariz Cabido", resultUpdate: "Force Fix" },
    );
  });

  it("sends nothing when the latest values were already saved", () => {
    assert.deepEqual(
      diffDraftPatch({ level2AgentName: "Mariz Cabido" }, { level2AgentName: "Mariz Cabido" }),
      {},
    );
  });

  it("sends only the field picked after the first save", () => {
    // The race this guards against: the agent was saved first, then the
    // result was picked while the draft was still being created.
    assert.deepEqual(
      diffDraftPatch(
        { level2AgentName: "Mariz Cabido" },
        { level2AgentName: "Mariz Cabido", resultUpdate: "Interested" },
      ),
      { resultUpdate: "Interested" },
    );
  });

  it("sends an empty string for a field cleared after it was saved", () => {
    assert.deepEqual(
      diffDraftPatch({ resultUpdate: "Interested" }, {}),
      { resultUpdate: "" },
    );
  });

  it("treats an undefined value the same as a missing one", () => {
    assert.deepEqual(
      diffDraftPatch({}, { updatedNotes: undefined }),
      {},
    );
  });
});

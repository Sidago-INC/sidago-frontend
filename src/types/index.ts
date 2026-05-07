// Re-exports from domain-specific type files.
// Import from these directly for better discoverability,
// or use this barrel for convenience.

export type { AirtableAgent, Agent } from "./agent.types";
export type { AirtableLead, Lead } from "./lead.types";
export type { CallsFormState, CallsModalState } from "./form.types";
export { createFormStateFromLead } from "./form.types";

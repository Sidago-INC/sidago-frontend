export interface AirtableAgent {
  id: string;
  fields: {
    name?: string;
    surname?: string;
    email?: string;
    brand?: string;
    "Hot Leads Today"?: number;
    today_calls_made?: number;
    record_id?: string;
    winner?: boolean;
    monthly_calls?: number;
    monthly_hot_leads?: number;
    monthly_lost_hot_leads?: number;
    monthly_contract_closed?: number;
    monthly_points?: number;
    last_month_calls?: number;
    last_month_hot_lead?: number;
    last_month_contract_closed?: number;
    last_month_winner?: boolean;
    last_month_points?: number;
    monthly_winner?: boolean;
    last_month_lost_lead?: number;
    count_wins?: number;
    all_points?: number;
  };
}

export interface Agent {
  recordId: string;
  name: string;
  surname: string;
  email: string;
  brand: string;
  hot_leads_today: number;
  today_calls_made: number;
  winner: boolean;
  monthly_calls: number;
  monthly_hot_leads: number;
  monthly_lost_hot_leads: number;
  monthly_contract_closed: number;
  monthly_points: number;
  last_month_calls: number;
  last_month_hot_lead: number;
  last_month_contract_closed: number;
  last_month_winner: boolean;
  last_month_points: number;
  monthly_winner: boolean;
  last_month_lost_lead: number;
  count_wins: number;
  all_points: number;
}


export type AGENT_TYPE = {
  name:string;
  surname:string;
  email?:string;
}

export const AGENT_VALUES: AGENT_TYPE[] = [
  {
    name: "John",
    surname: "Doe",
    email: "john.doe@example.com"
  },
  {
    name: "Jane",
    surname: "Smith",
    email: "jane.smith@example.com"
  },
  {
    name: "Michael",
    surname: "Johnson",
    email: "michael.johnson@example.com"
  },
  {
    name: "Emily",
    surname: "Davis",
    email: "emily.davis@example.com"
  },
  {
    name: "David",
    surname: "Wilson",
    email: "david.wilson@example.com"
  },
];

export const AGENT_OPTIONS = AGENT_VALUES.map((agent) => ({
  value: agent,
  label: `${agent.name} ${agent.surname}`,
}));

export function getRandomAgent(): AGENT_TYPE {
  const randomIndex = Math.floor(Math.random() * AGENT_VALUES.length);
  return AGENT_VALUES[randomIndex];
}
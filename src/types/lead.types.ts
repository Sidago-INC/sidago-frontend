import { COMPANY, getRandomCompany } from "./company.types";
import { CONTACT_TYPE, getRandomContactType } from "./contact-type.types";
import { LEAD_TYPE, getRandomLeadType } from "./lead-type.types";

export interface AirtableLead {
  id: string;
  fields: {
    lead_id?: string;
    full_name?: string;
    timezone?: string;
    lead_type?: string;
    contact_type?: string;
    company_name?: string;
    role?: string;
    phone?: string;
    email?: string;
    call_notes_sidago?: string;
    not_work_anymore?: boolean;
    next_follow_up_date_sidago?: string;
    last_called_date_sidago?: string;
    history_call_notes_sidago?: string;
    history_calls_sidago?: string;
    last_fixed_date?: string;
    other_contacts?: string;
  };
}

export interface Lead {
  recordId: string;
  lead_id: string;
  full_name: string;
  timezone: string;
  lead_type: string;
  contact_type: string;
  company_name: string;
  role: string;
  phone: string;
  email: string;
  call_notes_sidago: string;
  not_work_anymore: boolean;
  next_follow_up_date_sidago: string;
  last_called_date_sidago: string;
  history_call_notes_sidago: string;
  history_calls_sidago: string;
  last_fixed_date: string;
  other_contacts: string;
}




export type LEAD = {
  // Core identity
  id?: string | number;
  lead_id?: string; // functional field
  lead?: string;
  lead_id_end_with?: string; // functional field
  // Company info
  company?: COMPANY;
  // Person info
  full_name?: string;
  role?: string;
  phone?: string;
  email?: string;
  // Contact info
  contact_type?: CONTACT_TYPE;
  // Lead info
  lead_type?: LEAD_TYPE;
  // Call / notes (sidago system)
  call_result_sidago?: string;
  to_be_called_by_sidago?: string; // agent name
  follow_up_date?:string;
  call_result_code?:string; // functional field
  to_be_logged?: boolean; // functional field
  next_follow_up_date_sidago?: string;
  call_notes_sidago?: string;
  history_calls_sidago?: string;
  date_become_hot?: string;
  days_hot?: number; // functional field
  //benton
  lead_type_benton?: LEAD_TYPE;
  call_result_benton?: string;
  to_be_called_by_benton?: string; // agent name
  follow_up_date_benton?: string;
  call_result_code_benton?: string; // functional field
  to_be_logged_benton?: boolean; // functional field
  next_follow_up_date_benton?: string;
  call_notes_benton?: string;
  history_call_notes_benton?: string;
  history_calls_benton?: string;
  date_become_hot_benton?: string;
  days_hot_benton?: number; // functional field
  manual_update?:string;
  counter_b?: number; // functional field
  counter_f?: number; // functional field
  counter_fixes?:number; // functional field
  old_phones?:string;
  last_fixed_date?: string;
  to_be_sent_email?: boolean;
  to_be_logged_email_sidago?: boolean;
  blocked_email?: boolean;
  last_called_by?: string; // agent name
  email_status_mariz?: string;
  email_status_rex?: string;
  history_email_rex?: string;
  email_status_tom?: string;
  history_email_tom?: string;
  to_be_sent_email_benton?: boolean;
  to_be_logged_email_benton?: boolean;
  last_called_by_benton?: string; // agent name
  email_status_paul_benton?: string;
  not_work_anymore?: boolean;
  last_called_date_sidago?: string;
  last_called_date_benton?: string;
  date_become_ignore_benton?: string;
  days_ignore_benton?: number; // functional field
  date_become_ignore_sidago?: string;
  days_ignore_sidago?: number; // functional field
  other_contacts?: string;
  last_called_by_dashboard_sidago?: string; // agent name
  last_called_by_dashboard_benton?: string; // agent name
  checkbox_to_be_logged_email_sidago?: boolean;
  checkbox_to_be_logged_email_benton?: boolean;
  "missing/dead_email"?: boolean;
  record_id?:string;
  good_result_log?: string;
  last_modified?: string;
  created?: string;
  last_updated_to_be_called_by_sidago?: string;
  trigger_automation_redistribute?: boolean;
  level_2_copy?: string;
  automation_text?: string;
  last_updated_to_be_called_by_benton?: string;
  email_status_bryan_benton?: string;
  history_email_bryan_benton?: string;
  additonal_contacts?: string;
  previous_lead_type?: LEAD_TYPE;
  previous_lead_type_benton?: LEAD_TYPE;
  set_fix_date?: string;
  set_cant_locate_date_sidago?: string;
  lead_skip_by?: string; // agent name
  lead_skip_notes?: string;
  timezone_priority?: string; // functional field
  has_other_contacts?: boolean;
  "last_action_date(svg,benton)"?: string;
  not_work_modified_by?: string; // agent name
  additional_contacts?: string;
  svg_sms_log?: boolean;
  sms_status?: string;
  benton_sms_log?: boolean;
  "95rm_sms_log"?: boolean;
  call_notes_95rm?: string;
  call_result_95rm?: string;
  call_result_code_95rm?: string; // functional field
  checkbox_to_be_logged_95rm?: boolean; // functional field
  date_become_hot_95rm?: string;
  date_become_ignore_95rm?: string;
  days_hot_95rm?: number; // functional field
  days_ignore_95rm?: number; // functional field
  email_status_taylor_95rm?: string;
  follow_up_date_95rm?: string;
  history_call_notes_95rm?: string;
  history_calls_95rm?: string;
  history_email_taylor_95rm?: string;
  last_called_by_95rm?: string; // agent name
  last_called_by_dashboard_95rm?: string; // agent name
  last_called_date_95rm?: string;
  last_updated_to_be_called_by_95rm?: string;
  lead_type_95rm?: LEAD_TYPE;
  next_follow_up_date_95rm?: string;
  previous_lead_type_95rm?: LEAD_TYPE;
  "email(from_to_be_called_by_95rm)"?: string; // agent name
  "name(from_to_be_called_by_95rm)"?: string; // agent name
  "fullname(from_to_be_called_by_95rm)"?: string; // agent name
  to_be_logged_95rm?: boolean; // functional field
  to_be_logged_email_95rm?: boolean; // functional field
  to_be_sent_email_95rm?: boolean;
  set_cant_locate_date_95rm?: string;
  lead_type_95rm_last_modified_by?: string; // agent name
  company_called_today?: boolean;
  last_modified_company_called_today?: string;
  last_modified_time_lead_type?: string;
  last_modified_time_lead_type_benton?: string;
  last_modified_time_lead_type_95rm?: string;
  created_by?: string; // agent name
};

const FIRST_NAMES = ["John", "Jane", "Alex", "Chris", "Sam", "Taylor", "Jordan", "Robin"];
const LAST_NAMES = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Miller", "Davis"];
const ROLES = ["Manager", "Engineer", "Director", "Sales Rep", "Consultant"];
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "example.com"];
const AGENT_NAMES = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace"];
const CALL_RESULTS = ["Answered", "No Answer", "Voicemail", "Busy", "Wrong Number"];
const CALL_RESULT_CODES = ["A1", "B2", "C3", "D4", "NA", "VM"];
const EMAIL_STATUSES = ["Sent", "Opened", "Replied", "Bounced", "Unsubscribed", "Pending"];
const SMS_STATUSES = ["Sent", "Delivered", "Failed", "Pending"];
const CALL_NOTES_POOL = [
  "Left voicemail, will call back.",
  "Spoke briefly, sent follow-up email.",
  "Not available, try again next week.",
  "Interested, schedule a demo.",
  "Do not call again.",
];
const HISTORY_POOL = [
  "2024-01-10: Called, no answer.",
  "2024-02-14: Left voicemail.",
  "2024-03-22: Spoke, expressed interest.",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBool() {
  return Math.random() > 0.5;
}

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function randomPhone() {
  return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
}

function randomEmail(name: string) {
  const clean = name.toLowerCase().replace(/\s/g, ".");
  return `${clean}@${getRandomItem(EMAIL_DOMAINS)}`;
}

function randomDate() {
  return new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
}

function randomFutureDate(maxDaysAhead = 14) {
  const daysAhead = Math.floor(Math.random() * maxDaysAhead) + 1;
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);
  future.setHours(9 + randomInt(8), randomInt(60), 0, 0);
  return future.toISOString();
}

export function generateRandomLeads(count: number): LEAD[] {
  const leads: LEAD[] = [];

  for (let i = 0; i < count; i++) {
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const company = getRandomCompany();
    const leadId = `LD-${Date.now()}-${i}`;
    const agentName = getRandomItem(AGENT_NAMES);

    const lead: LEAD = {
      // Core identity
      id: i + 1,
      lead_id: leadId,
      lead: company.name,
      lead_id_end_with: leadId.slice(-4),

      // Company & person
      company,
      full_name: fullName,
      role: getRandomItem(ROLES),
      phone: randomPhone(),
      email: randomEmail(fullName),

      // Contact & lead classification
      contact_type: getRandomContactType(),
      lead_type: getRandomLeadType(),

      // Sidago call/notes
      call_result_sidago: getRandomItem(CALL_RESULTS),
      to_be_called_by_sidago: agentName,
      follow_up_date: randomFutureDate(),
      call_result_code: getRandomItem(CALL_RESULT_CODES),
      to_be_logged: randomBool(),
      next_follow_up_date_sidago: randomFutureDate(),
      call_notes_sidago: getRandomItem(CALL_NOTES_POOL),
      history_calls_sidago: getRandomItem(HISTORY_POOL),
      date_become_hot: randomDate(),
      days_hot: randomInt(30),

      // Benton call/notes
      lead_type_benton: getRandomLeadType(),
      call_result_benton: getRandomItem(CALL_RESULTS),
      to_be_called_by_benton: getRandomItem(AGENT_NAMES),
      follow_up_date_benton: randomFutureDate(),
      call_result_code_benton: getRandomItem(CALL_RESULT_CODES),
      to_be_logged_benton: randomBool(),
      next_follow_up_date_benton: randomFutureDate(),
      call_notes_benton: getRandomItem(CALL_NOTES_POOL),
      history_call_notes_benton: getRandomItem(HISTORY_POOL),
      history_calls_benton: getRandomItem(HISTORY_POOL),
      date_become_hot_benton: randomDate(),
      days_hot_benton: randomInt(30),

      // Counters & maintenance
      manual_update: randomDate(),
      counter_b: randomInt(20),
      counter_f: randomInt(20),
      counter_fixes: randomInt(10),
      old_phones: randomPhone(),
      last_fixed_date: randomDate(),

      // Email flags — sidago
      to_be_sent_email: randomBool(),
      to_be_logged_email_sidago: randomBool(),
      blocked_email: randomBool(),
      last_called_by: agentName,
      email_status_mariz: getRandomItem(EMAIL_STATUSES),
      email_status_rex: getRandomItem(EMAIL_STATUSES),
      history_email_rex: getRandomItem(HISTORY_POOL),
      email_status_tom: getRandomItem(EMAIL_STATUSES),
      history_email_tom: getRandomItem(HISTORY_POOL),

      // Email flags — benton
      to_be_sent_email_benton: randomBool(),
      to_be_logged_email_benton: randomBool(),
      last_called_by_benton: getRandomItem(AGENT_NAMES),
      email_status_paul_benton: getRandomItem(EMAIL_STATUSES),

      // Status flags
      not_work_anymore: randomBool(),
      last_called_date_sidago: randomDate(),
      last_called_date_benton: randomDate(),
      date_become_ignore_benton: randomDate(),
      days_ignore_benton: randomInt(15),
      date_become_ignore_sidago: randomDate(),
      days_ignore_sidago: randomInt(15),
      other_contacts: randomPhone(),
      last_called_by_dashboard_sidago: getRandomItem(AGENT_NAMES),
      last_called_by_dashboard_benton: getRandomItem(AGENT_NAMES),
      checkbox_to_be_logged_email_sidago: randomBool(),
      checkbox_to_be_logged_email_benton: randomBool(),
      "missing/dead_email": randomBool(),

      // Record metadata
      record_id: `REC-${1000 + i}`,
      good_result_log: getRandomItem(CALL_NOTES_POOL),
      last_modified: randomDate(),
      created: randomDate(),
      last_updated_to_be_called_by_sidago: randomDate(),
      trigger_automation_redistribute: randomBool(),
      level_2_copy: `L2-${i}`,
      automation_text: `Automation note for lead ${i + 1}`,
      last_updated_to_be_called_by_benton: randomDate(),
      email_status_bryan_benton: getRandomItem(EMAIL_STATUSES),
      history_email_bryan_benton: getRandomItem(HISTORY_POOL),
      additonal_contacts: randomPhone(),
      previous_lead_type: getRandomLeadType(),
      previous_lead_type_benton: getRandomLeadType(),
      set_fix_date: randomDate(),
      set_cant_locate_date_sidago: randomDate(),
      lead_skip_by: getRandomItem(AGENT_NAMES),
      lead_skip_notes: getRandomItem(CALL_NOTES_POOL),
      timezone_priority: `TZ-${randomInt(5) + 1}`,
      has_other_contacts: randomBool(),
      "last_action_date(svg,benton)": randomDate(),
      not_work_modified_by: getRandomItem(AGENT_NAMES),
      additional_contacts: randomPhone(),

      // SMS
      svg_sms_log: randomBool(),
      sms_status: getRandomItem(SMS_STATUSES),
      benton_sms_log: randomBool(),

      // 95rm
      "95rm_sms_log": randomBool(),
      call_notes_95rm: getRandomItem(CALL_NOTES_POOL),
      call_result_95rm: getRandomItem(CALL_RESULTS),
      call_result_code_95rm: getRandomItem(CALL_RESULT_CODES),
      checkbox_to_be_logged_95rm: randomBool(),
      date_become_hot_95rm: randomDate(),
      date_become_ignore_95rm: randomDate(),
      days_hot_95rm: randomInt(30),
      days_ignore_95rm: randomInt(15),
      email_status_taylor_95rm: getRandomItem(EMAIL_STATUSES),
      follow_up_date_95rm: randomFutureDate(),
      history_call_notes_95rm: getRandomItem(HISTORY_POOL),
      history_calls_95rm: getRandomItem(HISTORY_POOL),
      history_email_taylor_95rm: getRandomItem(HISTORY_POOL),
      last_called_by_95rm: getRandomItem(AGENT_NAMES),
      last_called_by_dashboard_95rm: getRandomItem(AGENT_NAMES),
      last_called_date_95rm: randomDate(),
      last_updated_to_be_called_by_95rm: randomDate(),
      lead_type_95rm: getRandomLeadType(),
      next_follow_up_date_95rm: randomFutureDate(),
      previous_lead_type_95rm: getRandomLeadType(),
      "email(from_to_be_called_by_95rm)": randomEmail(getRandomItem(AGENT_NAMES)),
      "name(from_to_be_called_by_95rm)": getRandomItem(FIRST_NAMES),
      "fullname(from_to_be_called_by_95rm)": `${getRandomItem(FIRST_NAMES)} ${getRandomItem(LAST_NAMES)}`,
      to_be_logged_95rm: randomBool(),
      to_be_logged_email_95rm: randomBool(),
      to_be_sent_email_95rm: randomBool(),
      set_cant_locate_date_95rm: randomDate(),
      lead_type_95rm_last_modified_by: getRandomItem(AGENT_NAMES),

      // Company-level tracking
      company_called_today: randomBool(),
      last_modified_company_called_today: randomDate(),
      last_modified_time_lead_type: randomDate(),
      last_modified_time_lead_type_benton: randomDate(),
      last_modified_time_lead_type_95rm: randomDate(),
      created_by: getRandomItem(AGENT_NAMES),
    };

    leads.push(lead);
  }

  return leads;
}

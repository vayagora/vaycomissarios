export type Role = "vay" | "comissario";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  commissioner_id: string | null;
  must_change_password: boolean;
};

export type TermLists = { term_receives: string[]; term_can: string[]; term_cannot: string[] };

export type Commissioner = TermLists & {
  id: string;
  name: string;
  email: string;
  hubspot_contact_id: string;
  in_program: boolean;
  cpf: string;
  since: string;
  balance: number;
  balance_synced_at: string | null;
  term_start: string | null;
  term_end: string | null;
  created_at: string;
};

export type CreditKind = "acumulo" | "uso";

export type CreditEntry = {
  id: string;
  commissioner_id: string;
  hubspot_id: string;
  created_on: string;
  title: string;
  kind: CreditKind;
  reason: string;
  amount: number;
};

export type MileCategory = {
  id: string;
  commissioner_id: string;
  company: string;
  tier: string;
  valid_until: string;
  updated_at: string;
};

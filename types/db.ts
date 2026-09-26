export type RenewalStatus = "Not discussed" | "In talks" | "Renewing" | "Leaving";

export type ProspectStatus = "Not contacted" | "No reply" | "Replied" | "Converted";

export interface Contract {
  id: string;
  brand: string;
  category: string;
  space: string;
  start_date: string | null;
  end_date: string;
  rent: number;
  terms: string;
  contact_name: string;
  phone: string;
  owner: string;
  renewal_status: RenewalStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: string;
  name: string;
  category: string;
  contact_name: string;
  phone: string;
  tags: string[];
  status: ProspectStatus;
  first_contacted: string | null;
  join_date: string | null;
  space: string;
  created_at: string;
  updated_at: string;
}

export interface ProspectComment {
  id: string;
  prospect_id: string;
  body: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: Contract;
        Insert: Partial<Contract> & Pick<Contract, "brand" | "end_date">;
        Update: Partial<Contract>;
      };
      prospects: {
        Row: Prospect;
        Insert: Partial<Prospect> & Pick<Prospect, "name">;
        Update: Partial<Prospect>;
      };
      prospect_comments: {
        Row: ProspectComment;
        Insert: Partial<ProspectComment> & Pick<ProspectComment, "prospect_id" | "body">;
        Update: Partial<ProspectComment>;
      };
    };
  };
}

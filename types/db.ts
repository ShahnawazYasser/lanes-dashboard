export type RenewalStatus = "Not discussed" | "In talks" | "Renewing" | "Leaving";

export type ProspectStatus = "Not contacted" | "No reply" | "Replied" | "Converted";

// `type` (not `interface`) is required here: postgrest-js's generic table
// constraints (`Row extends Record<string, unknown>`, etc.) only structurally
// match plain object type literals. An `interface` has no implicit index
// signature, so it fails those `extends` checks and silently collapses to
// `never` throughout the typed client (insert/update/select all break).
export type Contract = {
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
};

export type Prospect = {
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
};

export type ProspectComment = {
  id: string;
  prospect_id: string;
  body: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      contracts: {
        Row: Contract;
        Insert: Partial<Contract> & Pick<Contract, "brand" | "end_date">;
        Update: Partial<Contract>;
        Relationships: [];
      };
      prospects: {
        Row: Prospect;
        Insert: Partial<Prospect> & Pick<Prospect, "name">;
        Update: Partial<Prospect>;
        Relationships: [];
      };
      prospect_comments: {
        Row: ProspectComment;
        Insert: Partial<ProspectComment> & Pick<ProspectComment, "prospect_id" | "body">;
        Update: Partial<ProspectComment>;
        Relationships: [
          {
            foreignKeyName: "prospect_comments_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

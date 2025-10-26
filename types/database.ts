// Database type definitions

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
      };
      people: {
        Row: Person;
        Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Person, 'id' | 'created_at' | 'updated_at'>>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>;
      };
      campaign_contacts: {
        Row: CampaignContact;
        Insert: Omit<CampaignContact, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<CampaignContact, 'id' | 'created_at'>>;
      };
    };
  };
}

export interface Company {
  id: string;
  company_name: string;
  company_domain: string | null;
  company_linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  person_linkedin_url: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  person_id: string;
  company_id: string;
  job_title: string | null;
  work_email: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignContact {
  id: string;
  contact_id: string;
  campaign_key: string;
  input_values_jsonb: Record<string, any>;
  created_at: string;
}

// Extended contact type with joined person and company data
export interface ContactWithDetails extends Contact {
  person: Person;
  company: Company;
}

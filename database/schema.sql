-- UI Command Center Database Schema
-- Create tables for campaign staging system

-- Companies table: stores company-level data
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    company_domain TEXT,
    company_linkedin_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- People table: stores individual person data
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    person_linkedin_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table: main join table for contact-specific outreach information
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    job_title TEXT,
    work_email TEXT,
    phone_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Contacts table: stores per-contact per-campaign input values after transformation
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    campaign_key TEXT NOT NULL,
    input_values_jsonb JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Staged Contacts table: staging area for contacts being prepared for campaign delivery
-- This is a denormalized table for the mode-based workflow (Enroll → Push)
CREATE TABLE IF NOT EXISTS campaign_staged_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_key TEXT NOT NULL,
    campaign_name TEXT NOT NULL,

    -- Contact information (denormalized for easy querying)
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    work_email TEXT NOT NULL,
    company_name TEXT,
    company_domain TEXT,
    job_title TEXT,

    -- Transformed campaign data ready for delivery
    campaign_final_values JSONB NOT NULL,

    -- Workflow status tracking
    status TEXT NOT NULL DEFAULT 'staged', -- staged | confirmed | sent | failed

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Error tracking
    error_message TEXT
);

-- Indexes for campaign_staged_contacts
CREATE INDEX IF NOT EXISTS idx_campaign_staged_contacts_campaign_key ON campaign_staged_contacts(campaign_key);
CREATE INDEX IF NOT EXISTS idx_campaign_staged_contacts_status ON campaign_staged_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_staged_contacts_work_email ON campaign_staged_contacts(work_email);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_campaign_staged_contacts_updated_at ON campaign_staged_contacts;
CREATE TRIGGER update_campaign_staged_contacts_updated_at
    BEFORE UPDATE ON campaign_staged_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_people_company_id ON people(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_person_id ON contacts(person_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_contact_id ON campaign_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign_key ON campaign_contacts(campaign_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_people_updated_at ON people;
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

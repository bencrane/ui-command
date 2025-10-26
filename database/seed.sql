-- UI Command Center Database Seed Data
-- Sample data for testing the campaign staging system

-- Insert sample companies
INSERT INTO companies (id, company_name, company_domain, company_linkedin_url) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Acme Digital Marketing', 'acmedigital.com', 'https://linkedin.com/company/acme-digital'),
    ('22222222-2222-2222-2222-222222222222', 'TechGrowth Agency', 'techgrowth.io', 'https://linkedin.com/company/techgrowth');

-- Insert sample people
INSERT INTO people (id, full_name, first_name, last_name, person_linkedin_url, company_id) VALUES
    ('33333333-3333-3333-3333-333333333333', 'Sarah Johnson', 'Sarah', 'Johnson', 'https://linkedin.com/in/sarah-johnson', '11111111-1111-1111-1111-111111111111'),
    ('44444444-4444-4444-4444-444444444444', 'Michael Chen', 'Michael', 'Chen', 'https://linkedin.com/in/michael-chen', '11111111-1111-1111-1111-111111111111'),
    ('55555555-5555-5555-5555-555555555555', 'Emily Rodriguez', 'Emily', 'Rodriguez', 'https://linkedin.com/in/emily-rodriguez', '22222222-2222-2222-2222-222222222222');

-- Insert sample contacts
INSERT INTO contacts (id, person_id, company_id, job_title, work_email, phone_number) VALUES
    ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'CEO & Founder', 'sarah@acmedigital.com', '+1-555-0101'),
    ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Head of Growth', 'michael@acmedigital.com', '+1-555-0102'),
    ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'VP of Marketing', 'emily@techgrowth.io', '+1-555-0201'),
    ('99999999-9999-9999-9999-999999999999', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Chief Marketing Officer', 'sarah.johnson@acmedigital.com', NULL),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Director of Digital Strategy', 'e.rodriguez@techgrowth.io', '+1-555-0202');

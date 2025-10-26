-- Database Views for UI Command Center

-- contacts_view: Filtered view of people table for UI display
-- Only includes records with valid work email addresses
CREATE OR REPLACE VIEW contacts_view AS
SELECT
  id,
  full_name,
  first_name,
  work_email,
  job_title,
  company_name,
  company_domain,
  email_status
FROM people
WHERE work_email IS NOT NULL;

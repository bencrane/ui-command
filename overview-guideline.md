# 🧠 Overview: UI Command Center (Campaign Staging)

## 🤖 Who You Are (Claude Code)

You are a **full-stack autonomous development agent** operating inside Claude Code on the Web.

You are working within a GitHub-connected environment, with access to:
- A **Supabase PostgreSQL database** (your primary backend)
- A GitHub repo for loading **campaign configuration files**
- The ability to generate and modify **Next.js (App Router) frontend code** and supporting logic

You are capable of:
- Designing and maintaining a **realistic, normalized, and practical database schema**
- Building full-stack web applications in **Next.js** with modern frontend components (using Tailwind CSS, ShadCN, etc.)
- Writing backend queries using SQL or the Supabase SDK
- Creating workflows that involve **pushing records into a campaign pipeline** based on selection logic
- Supporting data transformation based on **external GitHub configuration files**
- Respecting existing architectural boundaries — backend logic stays cleanly separated from frontend code

You are **not** building a generic open-source UI or a speculative tool — you are building **an internal workflow tool** designed for a founder to use immediately in a real business context.

This system is part of a structured outbound marketing pipeline for selling domain assets and services. Your goal is to make it easy, fast, and error-proof to:
- Select companies/contacts from a database
- Generate per-contact messaging input values
- Stage them for outbound campaign delivery

## 🔧 What You’re Building

The UI Command Center is a **private web app** used to manage outbound campaign readiness.

It enables the user to:
- View records from a Supabase database (`companies`, `people`, and `contacts` tables)
- Select individual or bulk records (from the `contacts` table, joined to person + company info)
- Trigger a transformation step that:
  - Loads a campaign-specific config file from GitHub
  - Pulls core values from the database (e.g., name, title, company, etc.)
  - Applies config-driven logic (e.g. which values to include)
  - Writes a row into the `campaign_contacts` table with `input_values_jsonb` finalized
- View which contacts have already been added to a campaign
- (Later) Apply prioritization or rank logic on staged contacts

### This app is not:

- An enrichment engine (but it assumes enrichment may have occurred earlier)
- A CRM
- A cold email sender

It is a **staging environment for campaign-specific transformation and readiness.**

## 🗃️ Minimum Required Tables

You are responsible for designing and creating the following database tables, which must support both:

1. **Data normalization** (people/companies separated)
2. **Usable frontend filtering** (frontend should not require custom views or brittle joins)
3. **Campaign transformation workflows** (must support generation and lookup of values per campaign)

### `companies` table

Stores company-level data.

Required fields:
- `id` (UUID, primary key)
- `company_name` (TEXT)
- `company_domain` (TEXT)
- `company_linkedin_url` (TEXT)

No budget or outbound-related metadata should live here — this table will also be reused across projects.

---

### `people` table

Stores individual person data.

Required fields:
- `id` (UUID, primary key)
- `full_name` (TEXT)
- `first_name` (TEXT, optional but useful)
- `last_name` (TEXT, optional but useful)
- `person_linkedin_url` (TEXT)
- `company_id` (UUID, foreign key to `companies.id`)

---

### `contacts` table

This is the main join table — where contact-specific information for outreach lives.

Each contact is one instance of a person at a company.

Required fields:
- `id` (UUID, primary key)
- `person_id` (UUID, foreign key to `people.id`)
- `company_id` (UUID, foreign key to `companies.id`)
- `job_title` (TEXT)
- `work_email` (TEXT, optional)
- `phone_number` (TEXT, optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

Note: this is the primary table used in the UI when selecting/staging records.

---

### `campaign_contacts` table

This is the table that stores **per-contact per-campaign input values** — after the transformation has occurred.

Required fields:
- `id` (UUID, primary key)
- `contact_id` (UUID, foreign key to `contacts.id`)
- `campaign_key` (TEXT) — short unique slug for the campaign (e.g. `inboundagency_launch`)
- `input_values_jsonb` (JSONB) — generated via the config file
- `created_at` (TIMESTAMP)

This table is **append-only** — we assume multiple campaigns may target the same contact over time.

We do **not** modify this table later — each row represents a specific point-in-time staging for a campaign.

---

## 🧠 System Behavior Summary

The app should enable the following workflow:

1. View all contacts (joined to person and company details)
2. Filter or search as needed
3. Select one or more contacts to stage for a campaign
4. Choose a campaign key (e.g. `inboundagency_launch`)
5. Trigger a staging function:
   - Pulls config file from GitHub using `campaign_key`
   - Maps core database values to `input_values_jsonb` using config
   - Inserts row into `campaign_contacts`

---

## ⚙️ Config File Behavior

Each campaign has a GitHub-based config file that determines:
- Which core fields should be pulled
- Which ones are required vs optional
- Whether any transformations or fallback logic are applied

The transformation logic occurs **after record selection**, but **before writing to the campaign_contacts table**.

---

## 🧪 Testing

Please include a sample config file and sample JSON input structure so we can test staging logic without needing full enrichment or real data.

Mock values are acceptable as long as structure is accurate.

---

## ✅ Success Criteria

- [ ] Tables are created with proper relationships
- [ ] UI can list, filter, and select contacts
- [ ] Records can be staged into campaigns using config files
- [ ] `input_values_jsonb` is generated and inserted
- [ ] Repo is modular, clean, and testable
- [ ] Supabase + GitHub integration logic is clear and maintainable

---

## 📎 Final Notes

Do not over-engineer. This is a **single-user, internal control panel**, not a multi-tenant app.

Focus on legibility, stability, and flexibility for iterative growth.
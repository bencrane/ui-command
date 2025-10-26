# UI Command Center

A private web application for managing outbound campaign staging. This internal tool enables you to select contacts from a database, apply campaign-specific transformations via GitHub config files, and stage them for campaign delivery.

## Overview

This is a single-user, internal staging dashboard designed for a specific business workflow: selling domain assets and services through outbound marketing. It bridges the gap between a normalized contact database and campaign delivery systems.

### What It Does

1. **View & Select Contacts** - Browse contacts with joined person and company data
2. **Search & Filter** - Find contacts by name, company, or job title
3. **Stage for Campaigns** - Select contacts and apply campaign-specific transformations
4. **Config-Driven Logic** - Use GitHub-hosted config files to define field mappings and requirements

### What It's NOT

- Not an enrichment engine
- Not a CRM
- Not an email sender
- Not a multi-tenant application

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Config Storage**: GitHub (public raw URLs)

## Database Schema

### Tables

1. **companies** - Company-level data
   - `id`, `company_name`, `company_domain`, `company_linkedin_url`

2. **people** - Individual person data
   - `id`, `full_name`, `first_name`, `last_name`, `person_linkedin_url`, `company_id`

3. **contacts** - Contact-specific outreach information (main join table)
   - `id`, `person_id`, `company_id`, `job_title`, `work_email`, `phone_number`

4. **campaign_contacts** - Staged contacts with campaign-specific input values
   - `id`, `contact_id`, `campaign_key`, `input_values_jsonb`

## Setup Instructions

### 1. Prerequisites

- Node.js 20+
- Access to Supabase PostgreSQL database
- GitHub repository for campaign config files

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `SUBSTRATE_RA_HOST` - Supabase host
- `SUBSTRATE_RA_SERVICE_ROLE_KEY` - Supabase service role key
- `GITHUB_CAMPAIGNS_BASE_URL` - Base URL for campaign config files

### 4. Set Up Database

Run the schema creation script in your Supabase SQL editor:

```sql
-- Run the contents of database/schema.sql
```

Then seed with sample data:

```sql
-- Run the contents of database/seed.sql
```

### 5. Create Campaign Config Files

Campaign configs should be stored in GitHub following this structure:

```
campaigns/
  {campaign_key}/
    config.json
```

Example: `campaigns/inboundagency_launch/config.json`

Config file format:

```json
{
  "campaign_key": "inboundagency_launch",
  "campaign_name": "Inbound Agency Launch Outreach",
  "core_values_mapping": {
    "first_name": "first_name",
    "company_name": "company_name",
    "company_domain": "company_domain",
    "job_title": "job_title"
  },
  "required_fields": ["first_name", "company_name"],
  "optional_fields": ["job_title", "company_domain"]
}
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage

### Staging Contacts

1. Navigate to `/contacts`
2. Use the search bar to filter contacts
3. Select contacts using checkboxes
4. Enter or select a campaign key
5. Click "Stage" to process

### How Staging Works

1. **Config Fetch** - Fetches campaign config from GitHub
2. **Data Query** - Retrieves selected contacts with joined person/company data
3. **Field Mapping** - Maps database fields to campaign input values per config
4. **Validation** - Checks that all required fields are present
5. **Insert** - Writes staged records to `campaign_contacts` table

Contacts missing required fields are skipped with a warning message.

## API Endpoints

### GET `/api/contacts`

Fetch all contacts with joined data.

Query params:
- `search` (optional) - Search by name, company, or title

### POST `/api/stage-contacts`

Stage selected contacts for a campaign.

Request body:
```json
{
  "contact_ids": ["uuid1", "uuid2"],
  "campaign_key": "inboundagency_launch"
}
```

Response:
```json
{
  "success": true,
  "staged_count": 4,
  "skipped_count": 1,
  "errors": ["Contact xyz skipped: missing required fields [first_name]"]
}
```

## Project Structure

```
ui-command/
├── app/
│   ├── api/
│   │   ├── contacts/       # Fetch contacts endpoint
│   │   └── stage-contacts/ # Staging logic endpoint
│   ├── contacts/           # Main contacts page
│   ├── layout.tsx
│   ├── page.tsx           # Home page
│   └── globals.css
├── campaigns/             # Sample campaign configs
│   └── inboundagency_launch/
│       └── config.json
├── components/
│   └── ui/               # Reusable UI components
├── database/
│   ├── schema.sql        # Database schema
│   └── seed.sql          # Sample seed data
├── lib/
│   ├── supabase.ts       # Supabase client setup
│   └── utils.ts          # Utility functions
├── types/
│   ├── api.ts            # API type definitions
│   └── database.ts       # Database type definitions
└── .env.example
```

## Development Notes

- **No Authentication** - This is a localhost-only tool
- **Append-Only** - `campaign_contacts` table allows duplicate staging (no unique constraints)
- **Error Handling** - Contacts with missing required fields are skipped, not failed
- **Search** - Simple ILIKE query across name, company, and title

## Future Enhancements

- Prioritization/ranking logic for staged contacts
- View/manage already-staged contacts
- Bulk actions (delete, re-stage)
- Campaign history and reporting
- Advanced filtering options

## License

Internal use only.

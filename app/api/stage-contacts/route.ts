import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { StageContactsRequest, StageContactsResponse, CampaignConfig } from '@/types/api';
import type { ContactWithDetails } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body: StageContactsRequest = await request.json();
    const { contact_ids, campaign_key } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'contact_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!campaign_key || typeof campaign_key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'campaign_key is required' },
        { status: 400 }
      );
    }

    // Fetch campaign config from GitHub
    const githubBaseUrl = process.env.GITHUB_CAMPAIGNS_BASE_URL || 'https://raw.githubusercontent.com/user/repo/main/campaigns/';
    const configUrl = `${githubBaseUrl}${campaign_key}/config.json`;

    let config: CampaignConfig;
    try {
      const configResponse = await fetch(configUrl);
      if (!configResponse.ok) {
        return NextResponse.json(
          { success: false, error: `Campaign config not found at ${configUrl}` },
          { status: 404 }
        );
      }
      config = await configResponse.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch campaign config: ${error}` },
        { status: 500 }
      );
    }

    // Fetch all contacts with joined person and company data
    const { data: contacts, error: fetchError } = await supabase
      .from('contacts')
      .select(`
        *,
        person:people(*),
        company:companies(*)
      `)
      .in('id', contact_ids);

    if (fetchError) {
      console.error('Error fetching contacts:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch contacts from database' },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contacts found with the provided IDs' },
        { status: 404 }
      );
    }

    const stagedRecords = [];
    const errors: string[] = [];
    let skippedCount = 0;

    // Process each contact
    for (const contact of contacts as any[]) {
      try {
        // Extract data from nested objects
        const person = contact.person;
        const company = contact.company;

        // Build the input values object based on config mapping
        const inputValues: Record<string, any> = {};
        const missingRequired: string[] = [];

        // Map all fields from the config
        for (const [mappingKey, dbField] of Object.entries(config.core_values_mapping)) {
          let value = null;

          // Get value from appropriate source (contact, person, or company)
          if (dbField === 'first_name') {
            value = person?.first_name;
          } else if (dbField === 'last_name') {
            value = person?.last_name;
          } else if (dbField === 'full_name') {
            value = person?.full_name;
          } else if (dbField === 'person_linkedin_url') {
            value = person?.person_linkedin_url;
          } else if (dbField === 'company_name') {
            value = company?.company_name;
          } else if (dbField === 'company_domain') {
            value = company?.company_domain;
          } else if (dbField === 'company_linkedin_url') {
            value = company?.company_linkedin_url;
          } else if (dbField === 'job_title') {
            value = contact.job_title;
          } else if (dbField === 'work_email') {
            value = contact.work_email;
          } else if (dbField === 'phone_number') {
            value = contact.phone_number;
          }

          // Check if required field is missing
          if (config.required_fields.includes(dbField) && (!value || value === null)) {
            missingRequired.push(dbField);
          }

          inputValues[mappingKey] = value;
        }

        // Skip contact if any required fields are missing
        if (missingRequired.length > 0) {
          skippedCount++;
          errors.push(`Contact ${contact.id} (${person?.full_name || 'Unknown'}) skipped: missing required fields [${missingRequired.join(', ')}]`);
          console.log(`Skipping contact ${contact.id}: missing required fields [${missingRequired.join(', ')}]`);
          continue;
        }

        // Prepare record for insertion
        stagedRecords.push({
          contact_id: contact.id,
          campaign_key: config.campaign_key,
          input_values_jsonb: inputValues,
        });
      } catch (error) {
        skippedCount++;
        errors.push(`Error processing contact ${contact.id}: ${error}`);
        console.error(`Error processing contact ${contact.id}:`, error);
      }
    }

    // Insert all staged records into campaign_contacts
    if (stagedRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('campaign_contacts')
        .insert(stagedRecords as any);

      if (insertError) {
        console.error('Error inserting campaign contacts:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to insert campaign contacts into database' },
          { status: 500 }
        );
      }
    }

    const response: StageContactsResponse = {
      success: true,
      staged_count: stagedRecords.length,
      skipped_count: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in stage-contacts API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

interface CampaignConfig {
  campaign_key: string;
  campaign_name: string;
  core_db_values: string[];
  misc_db_values: string[];
  campaign_input_values: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact_ids, campaign_key } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'contact_ids array is required' },
        { status: 400 }
      );
    }

    if (!campaign_key) {
      return NextResponse.json(
        { error: 'campaign_key is required' },
        { status: 400 }
      );
    }

    // Read campaign config file
    const configPath = path.join(
      process.cwd(),
      'projects',
      'uncommon-domains',
      'inbound-agency-domain-launch',
      'campaign-config.json'
    );

    let config: CampaignConfig;
    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      console.error('Error reading campaign config:', error);
      return NextResponse.json(
        { error: 'Campaign configuration not found' },
        { status: 404 }
      );
    }

    // Verify campaign key matches
    if (config.campaign_key !== campaign_key) {
      return NextResponse.json(
        { error: 'Campaign key mismatch' },
        { status: 400 }
      );
    }

    // Determine which fields to query from database
    const allDbFields = [...new Set([...config.core_db_values, ...config.misc_db_values])];

    // Always include id for reference
    const fieldsToQuery = ['id', ...allDbFields].join(', ');

    // Query contacts from people table
    const { data: contacts, error } = await supabase
      .from('people')
      .select(fieldsToQuery)
      .in('id', contact_ids);

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contact data', details: error.message },
        { status: 500 }
      );
    }

    // Format enrollment data
    const enrollmentData = {
      campaign_key: config.campaign_key,
      campaign_name: config.campaign_name,
      enrolled_at: new Date().toISOString(),
      contact_count: contacts.length,
      contacts: contacts.map((contact: any) => {
        // Build the contact data with only configured fields
        const contactData: any = { id: contact.id };

        // Add all db fields that are in the config
        allDbFields.forEach(field => {
          contactData[field] = contact[field] || null;
        });

        return contactData;
      }),
      config: {
        core_db_values: config.core_db_values,
        misc_db_values: config.misc_db_values,
        campaign_input_values: config.campaign_input_values
      }
    };

    return NextResponse.json({
      success: true,
      enrollment: enrollmentData
    });

  } catch (error) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

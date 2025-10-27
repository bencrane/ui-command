import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts, campaign_key, campaign_name } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts provided' },
        { status: 400 }
      );
    }

    if (!campaign_key || !campaign_name) {
      return NextResponse.json(
        { error: 'Campaign key and name are required' },
        { status: 400 }
      );
    }

    console.log(`Enrolling ${contacts.length} contacts for campaign: ${campaign_key}`);

    // Prepare records for insertion
    const stagedRecords = contacts.map((contact: any) => ({
      campaign_key,
      campaign_name,
      first_name: contact.first_name,
      last_name: contact.last_name,
      full_name: contact.full_name,
      work_email: contact.work_email,
      company_name: contact.company_name,
      company_domain: contact.company_domain,
      job_title: contact.job_title,
      // Store all contact data in campaign_final_values for now
      // Future: apply campaign-specific transformations here
      campaign_final_values: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: contact.full_name,
        work_email: contact.work_email,
        company_name: contact.company_name,
        company_domain: contact.company_domain,
        job_title: contact.job_title,
        email_status: contact.email_status,
        person_linkedin_url: contact.person_linkedin_url,
        company_linkedin_url: contact.company_linkedin_url,
      },
      status: 'staged',
    }));

    // Insert into campaign_staged_contacts
    const { data, error } = await supabase
      .from('campaign_staged_contacts')
      .insert(stagedRecords)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to enroll contacts', details: error.message },
        { status: 500 }
      );
    }

    console.log(`Successfully enrolled ${data?.length || 0} contacts to staging`);

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      message: `Enrolled ${data?.length || 0} contacts for campaign: ${campaign_name}`,
    });
  } catch (error) {
    console.error('Enroll contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contact_ids } = body;

    if (!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) {
      return NextResponse.json(
        { error: 'No contact IDs provided' },
        { status: 400 }
      );
    }

    console.log(`Pushing ${contact_ids.length} contacts to Instantly`);

    // Fetch the contacts to get their campaign_final_values
    const { data: contacts, error: fetchError } = await supabase
      .from('campaign_staged_contacts')
      .select('*')
      .in('id', contact_ids)
      .eq('status', 'staged');

    if (fetchError) {
      console.error('Error fetching contacts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch contacts', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No staged contacts found with provided IDs' },
        { status: 404 }
      );
    }

    // TODO: Call Instantly API here with contacts[].campaign_final_values
    // For now, we'll just update the status to 'confirmed'
    console.log('Contacts to push to Instantly:', contacts.map(c => ({
      id: c.id,
      email: c.work_email,
      campaign: c.campaign_key,
      data: c.campaign_final_values
    })));

    // Update status to 'confirmed' and set sent_at
    const { data: updatedContacts, error: updateError } = await supabase
      .from('campaign_staged_contacts')
      .update({
        status: 'confirmed',
        sent_at: new Date().toISOString(),
      })
      .in('id', contact_ids)
      .select();

    if (updateError) {
      console.error('Error updating contact status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update contact status', details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`Successfully pushed ${updatedContacts?.length || 0} contacts to Instantly`);

    return NextResponse.json({
      success: true,
      count: updatedContacts?.length || 0,
      message: `Pushed ${updatedContacts?.length || 0} contacts to Instantly`,
    });
  } catch (error) {
    console.error('Push to Instantly error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

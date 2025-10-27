import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== STAGED CONTACTS API CALLED ===');

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'staged';
    const campaignKey = searchParams.get('campaign_key');

    let query = supabase
      .from('campaign_staged_contacts')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    // Optional: filter by campaign_key
    if (campaignKey) {
      query = query.eq('campaign_key', campaignKey);
    }

    const { data, error } = await query;

    if (error) {
      console.error('SUPABASE ERROR:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to fetch staged contacts',
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    console.log(`Fetched ${data?.length || 0} staged contacts`);

    return NextResponse.json({ contacts: data || [] });
  } catch (error) {
    console.error('UNEXPECTED ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

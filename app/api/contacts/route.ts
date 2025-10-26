import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('contacts')
      .select(`
        *,
        person:people(*),
        company:companies(*)
      `)
      .order('created_at', { ascending: false });

    // Apply search filter if provided
    if (search) {
      // Search across name, company name, and job title
      query = query.or(`
        people.full_name.ilike.%${search}%,
        companies.company_name.ilike.%${search}%,
        job_title.ilike.%${search}%
      `);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contacts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contacts: data || [] });
  } catch (error) {
    console.error('Unexpected error in contacts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

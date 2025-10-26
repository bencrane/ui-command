import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('=== CONTACTS API CALLED ===');
    const searchParams = request.nextUrl.searchParams;
    const emailStatus = searchParams.get('email_status') || '';
    const companies = searchParams.get('companies') || '';
    const title = searchParams.get('title') || '';

    console.log('Filter params:', { emailStatus, companies, title });

    let query = supabase
      .from('contacts_view')
      .select('*')
      .order('id', { ascending: false });

    console.log('Querying contacts_view...');

    // Apply email status filter if provided and not "All"
    if (emailStatus && emailStatus !== 'All') {
      console.log('Applying email status filter:', emailStatus);
      query = query.eq('email_status', emailStatus);
    }

    // Apply company filter if provided
    if (companies) {
      const companyList = companies.split(',').map(c => c.trim());
      console.log('Applying company filter:', companyList);
      query = query.in('company_name', companyList);
    }

    // Apply title filter if provided
    if (title) {
      console.log('Applying title filter:', title);
      query = query.ilike('job_title', `%${title}%`);
    }

    const { data, error } = await query;

    console.log('Query result:', {
      dataCount: data?.length || 0,
      hasError: !!error,
      errorMessage: error?.message
    });

    if (error) {
      console.error('SUPABASE ERROR FULL DETAILS:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to fetch contacts',
          details: error.message,
          code: error.code,
          hint: error.hint,
          fullError: error
        },
        { status: 500 }
      );
    }

    console.log('SUCCESS: Returning', data?.length || 0, 'contacts');
    return NextResponse.json({ contacts: data || [] });
  } catch (error) {
    console.error('UNEXPECTED ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

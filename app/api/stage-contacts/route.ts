import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contacts, campaign } = body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: 'No contacts provided' },
        { status: 400 }
      );
    }

    const pipedreamUrl = process.env.CAMPAIGN_STAGING_PIPEDREAM_ENDPOINT_URL;

    if (!pipedreamUrl) {
      console.error('CAMPAIGN_STAGING_PIPEDREAM_ENDPOINT_URL not configured');
      return NextResponse.json(
        { error: 'Pipedream endpoint not configured' },
        { status: 500 }
      );
    }

    console.log(`Staging ${contacts.length} contacts to Pipedream for campaign: ${campaign}`);

    // POST to Pipedream
    const response = await fetch(pipedreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign,
        contacts,
        staged_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pipedream error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to stage contacts', details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json().catch(() => ({}));

    console.log('Successfully staged contacts to Pipedream');

    return NextResponse.json({
      success: true,
      count: contacts.length,
      result,
    });
  } catch (error) {
    console.error('Stage contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

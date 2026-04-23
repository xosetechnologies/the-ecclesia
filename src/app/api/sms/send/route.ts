export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const AFRICAS_TALKING_API_KEY = process.env.AFRICAS_TALKING_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, message } = body;

    let result = { success: false, message: 'SMS not configured' };

    if (AFRICAS_TALKING_API_KEY) {
      try {
        const response = await fetch('https://api.altersaas.com/sms/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AFRICAS_TALKING_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: [to], message }),
        });
        result = await response.json();
      } catch (e) { result = { success: false, message: 'SMS API error' }; }
    }
    else if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: to,
              From: process.env.TWILIO_PHONE_NUMBER || '',
              Body: message,
            }),
          }
        );
        result = await response.json();
      } catch (e) { result = { success: false, message: 'Twilio error' }; }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: 'Error sending SMS' }, { status: 500 });
  }
}

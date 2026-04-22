import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, context, action } = body;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ message: 'AI not configured' }, { status: 500 });
    }

    let fullPrompt = prompt;
    if (context) {
      fullPrompt = `Context: ${context}\n\nPrompt: ${prompt}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      return NextResponse.json({ 
        response: data.candidates[0].content.parts[0].text 
      });
    }

    return NextResponse.json({ response: 'No response from AI' });
  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json({ message: 'AI Error' }, { status: 500 });
  }
}
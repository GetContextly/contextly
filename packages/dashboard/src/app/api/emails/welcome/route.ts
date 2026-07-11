import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'Contextly <welcome@getcontextly.dev>',
      to: [email],
      subject: 'Welcome to Contextly ◈',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #06070a; color: white; border-radius: 20px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Welcome to the context layer, ${name}.</h1>
          <p style="color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 30px;">
            You've successfully joined Contextly. Your AI agents are about to get a lot smarter.
          </p>
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
            <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #34FFB3; margin-top: 0;">Quick Start</h3>
            <code style="display: block; background: black; padding: 12px; border-radius: 8px; color: #34FFB3; font-family: monospace;">
              npm install -g @contextly/cli && contextly auth
            </code>
          </div>
          <p style="font-size: 12px; color: rgba(255,255,255,0.3);">
            Contextly Inc. • 123 Tech Lane, San Francisco, CA
          </p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

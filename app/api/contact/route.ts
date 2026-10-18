import { NextResponse } from 'next/server';

const MAX_BODY_BYTES = 10_000;
const LIMITS = { name: 100, email: 254, topic: 50, message: 5000 } as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Best-effort per-instance rate limit. Serverless instances don't share memory,
// so use a shared store (e.g. Upstash Redis) if abuse becomes a real problem.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > RATE_LIMIT_MAX;
}

function fail(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function readField(body: Record<string, unknown>, key: keyof typeof LIMITS): string | null {
  const value = body[key];
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > LIMITS[key] ? null : trimmed;
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host && new URL(origin).host !== host) {
    return fail('Cross-origin requests are not allowed.', 403);
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return fail('Expected a JSON body.', 415);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return fail('Too many messages. Please try again later.', 429);
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return fail('Message is too large.', 413);
    }

    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return fail('Invalid request body.', 400);
    }
    const fields = body as Record<string, unknown>;

    // Honeypot: real users never see or fill this field.
    if (typeof fields.company === 'string' && fields.company.length > 0) {
      return NextResponse.json({ success: true, message: 'Transmission successfully received.' });
    }

    const name = readField(fields, 'name');
    const email = readField(fields, 'email');
    const topic = readField(fields, 'topic');
    const message = readField(fields, 'message');

    if (name === null || email === null || topic === null || message === null) {
      return fail('One or more fields are invalid or too long.', 400);
    }
    if (!name || !email || !message) {
      return fail('Missing required fields (name, email, or message).', 400);
    }
    if (!EMAIL_REGEX.test(email)) {
      return fail('Invalid email address provided.', 400);
    }

    // In a production app, here you would dispatch an email via Resend/Postmark/Sendgrid
    // or store to database. Avoid logging personal data (name/email) to server logs.
    console.log('[Studio Contact Transmission]', {
      timestamp: new Date().toISOString(),
      topic: topic || 'General',
      messageLength: message.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Transmission successfully received.',
      data: {
        receiptId: `TX-${Date.now().toString(36).toUpperCase()}`,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return fail('Invalid JSON body.', 400);
    }
    console.error('Contact API Error:', error);
    return fail('Internal server error processing transmission.', 500);
  }
}

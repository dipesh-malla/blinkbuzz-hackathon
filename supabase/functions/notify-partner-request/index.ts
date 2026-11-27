// Emails the admin-set address when someone sends a "Become a partner" request.
// Safe to call publicly: it only acts on a request created in the last 15 minutes
// that has not been notified yet, and it only ever mails the admin's own address.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  required  – from resend.com (free tier is plenty)
//   NOTIFY_FROM     optional  – e.g. "BlinkBuzz <hello@yourdomain.com>" once your domain is verified in Resend
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, reason: 'method' }, 405);
  let body: { id?: string; check?: boolean } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const key = Deno.env.get('RESEND_API_KEY');
  // the admin panel asks this to show whether emails are switched on
  if (body.check) return json({ configured: !!key });

  const id = String(body.id ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, reason: 'bad id' }, 400);
  if (!key) return json({ ok: false, reason: 'email not configured' });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: r } = await db.from('sponsor_requests').select('*').eq('id', id).is('notified_at', null).gte('created_at', since).maybeSingle();
  if (!r) return json({ ok: false, reason: 'nothing to send' });

  const { data: s } = await db.from('private_settings').select('value').eq('key', 'notifyEmail').maybeSingle();
  const to = (s?.value ?? '').split(/[,;\s]+/).filter((x: string) => x.includes('@')).slice(0, 5);
  if (!to.length) return json({ ok: false, reason: 'no notify email set' });

  // claim it first so two calls never send twice
  const { data: claimed } = await db.from('sponsor_requests').update({ notified_at: new Date().toISOString() }).eq('id', id).is('notified_at', null).select('id');
  if (!claimed?.length) return json({ ok: false, reason: 'already sent' });

  const from = Deno.env.get('NOTIFY_FROM') ?? 'BlinkBuzz <onboarding@resend.dev>';
  const rows = [
    ['Company', r.company], ['Contact', r.contact_name], ['Email', r.email], ['Phone', r.phone],
    ['Website', r.website], ['Interested in', r.tier_interest], ['Message', r.message],
  ].filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top">${k}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to, reply_to: r.email,
      subject: `New partner request: ${r.company}`,
      html: `<div style="font-family:system-ui,sans-serif"><h2>New BlinkBuzz partner request</h2><table>${rows}</table><p style="color:#666">Reply to this email to contact them directly. All requests are in Admin → Sponsors → Partner requests.</p></div>`,
    }),
  });
  if (!res.ok) {
    await db.from('sponsor_requests').update({ notified_at: null }).eq('id', id);
    return json({ ok: false, reason: 'send failed', detail: await res.text() }, 502);
  }
  return json({ ok: true });
});

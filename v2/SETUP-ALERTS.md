# Broken Link Email Alerts — Setup Guide

When a user taps "Report broken link", you'll get an email like:
> **Subject:** 🔗 Broken link: Thai Peanut Noodles
> Recipe ID 4521 · URL · Reported at · User-Agent

## Steps (10 min)

### 1. Resend — free email API
1. Go to [resend.com](https://resend.com) → sign up free
2. **Settings → API Keys** → create a key, copy it
3. **Settings → Domains** → add `myharvestvegan.com`, add the DNS records they give you (2 TXT + 1 MX in Cloudflare DNS)
   - Until verified, you can use `onboarding@resend.dev` as the from address (change line in worker)

### 2. Cloudflare Worker — add secrets
In Cloudflare dashboard → Workers → your harvest worker → **Settings → Variables**:

| Variable | Type | Value |
|----------|------|-------|
| `RESEND_API_KEY` | Secret | `re_xxxxx` (from step 1) |
| `WEBHOOK_SECRET` | Secret | Pick any random string, e.g. `hv-wh-a7b3c9d2e5f1` |

Then redeploy the worker with the updated `cloudflare-worker.js` from this repo.

### 3. Supabase — run the SQL trigger
1. Open **Supabase → SQL Editor**
2. Paste the contents of `setup-broken-link-alerts.sql`
3. **Replace** `REPLACE_WITH_YOUR_WEBHOOK_SECRET` with the same secret you used in step 2
4. Click **Run**

### 4. Test it
Open any recipe in HARVEST → tap "Report broken link" → you should get an email within seconds.

## How it works
```
User taps "Report" → app_errors table (source=user_report)
    → Postgres trigger (pg_net)
    → POST myharvestvegan.com/api/report
    → Cloudflare Worker → Resend API → your inbox
```

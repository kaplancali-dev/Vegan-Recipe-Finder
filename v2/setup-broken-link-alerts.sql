-- ============================================================
-- Broken Link Report → Email Alert via Cloudflare Worker
-- ============================================================
-- This trigger fires when a user reports a broken link in the app.
-- It POSTs the report to your Cloudflare Worker, which emails you.
--
-- PREREQUISITES:
--   1. Enable pg_net extension (should already be enabled)
--   2. Set up Resend account (free) at https://resend.com
--   3. Add RESEND_API_KEY and WEBHOOK_SECRET as Cloudflare Worker secrets
--   4. Run this SQL in the Supabase SQL Editor
-- ============================================================

-- 1. Make sure pg_net is enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION notify_broken_link_report()
RETURNS trigger AS $$
BEGIN
  -- Only fire for user reports, not JS errors
  IF NEW.source = 'user_report' THEN
    PERFORM net.http_post(
      url := 'https://myharvestvegan.com/api/report',
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'message',    NEW.message,
          'line',       NEW.line,
          'stack',      NEW.stack,
          'user_agent', NEW.user_agent,
          'created_at', NEW.created_at
        )
      ),
      headers := jsonb_build_object(
        'Content-Type',     'application/json',
        'x-webhook-secret', 'REPLACE_WITH_YOUR_WEBHOOK_SECRET'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach the trigger to app_errors table
DROP TRIGGER IF EXISTS on_broken_link_report ON app_errors;
CREATE TRIGGER on_broken_link_report
  AFTER INSERT ON app_errors
  FOR EACH ROW
  EXECUTE FUNCTION notify_broken_link_report();

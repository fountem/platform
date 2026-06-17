# Applied Migrations

All 7 migrations applied manually via Supabase SQL Editor on 2026-06-16.

| Migration | Status | Tables Created |
|---|---|---|
| 001_extensions | ✅ Applied | vector, pg_trgm, uuid-ossp |
| 002_evidence | ✅ Applied | evidence_sources, evidence_chunks |
| 003_claims_verdicts | ✅ Applied | claims, verdicts |
| 004_video_detections | ✅ Applied | video_detections |
| 005_parties_issues | ✅ Applied | parties, issues, party_issue_positions, track_record_scores |
| 006_correction_packs_api | ✅ Applied | correction_packs, api_keys |
| 007_rls | ✅ Applied | Core RLS policies enabled |
| 008_detection_enhancements | ⏳ Pending | confidence band, signal_breakdown, review queue cols |
| 009_api_key_usage | ⏳ Pending | atomic `increment_api_key_usage()` RPC |
| 010_rls_complete | ⏳ Pending | RLS for parties/issues/positions/track records/api_keys + write locks |
| 011_auth_quotas | ⏳ Pending | profiles (+ signup trigger), user_usage, service_budget, increment_user_usage() / increment_global_budget() RPCs, RLS |

> Apply pending migrations in order via the Supabase SQL editor (or `supabase db push`)
> before go-live. They are additive and safe to run on the existing schema.
>
> After 011: in the Supabase dashboard enable the Email (magic link) and Google auth
> providers, and add `<app-url>/auth/callback` to the allowed redirect URLs for each app.

Supabase project ref: see `SUPABASE_PROJECT_REF` in your secret store (not committed).
Region: eu-west-2 (London)

> Security note: never commit the project ref, anon/publishable key, or service role key.
> All credentials live in the hosting provider's env vars / AWS Secrets Manager.

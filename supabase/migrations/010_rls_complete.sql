-- Complete RLS coverage. Migration 007 covered evidence/claims/verdicts/detections/
-- correction_packs. This covers the remaining tables.
--
-- Reference tables (parties/issues/positions/track records) are public-readable.
-- api_keys is NEVER exposed to the anon role — only the service role may touch it.

alter table parties enable row level security;
alter table issues enable row level security;
alter table party_issue_positions enable row level security;
alter table track_record_scores enable row level security;
alter table api_keys enable row level security;

-- Public read for reference data (drives the Fountem party dossiers).
create policy "public_parties" on parties for select using (true);
create policy "public_issues" on issues for select using (true);
create policy "public_positions" on party_issue_positions for select using (true);
create policy "public_track_records" on track_record_scores for select using (true);

-- Writes to reference tables: service role only.
create policy "service_parties_write" on parties for all using (auth.role() = 'service_role');
create policy "service_issues_write" on issues for all using (auth.role() = 'service_role');
create policy "service_positions_write" on party_issue_positions for all using (auth.role() = 'service_role');
create policy "service_track_write" on track_record_scores for all using (auth.role() = 'service_role');

-- api_keys: no anon access at all. Service role only (and the SECURITY DEFINER RPC).
create policy "service_api_keys" on api_keys for all using (auth.role() = 'service_role');

-- Lock down writes on the public-readable tables from 007 (read stays public, writes
-- restricted to the service role used by our API routes).
create policy "service_claims_write" on claims for all using (auth.role() = 'service_role');
create policy "service_verdicts_write" on verdicts for all using (auth.role() = 'service_role');
create policy "service_detections_write" on video_detections for all using (auth.role() = 'service_role');
create policy "service_corrections_write" on correction_packs for all using (auth.role() = 'service_role');

alter table evidence_sources enable row level security;
alter table evidence_chunks enable row level security;
alter table claims enable row level security;
alter table verdicts enable row level security;
alter table video_detections enable row level security;
alter table correction_packs enable row level security;

-- Public read on completed verdicts
create policy "public_verdicts" on verdicts for select using (true);
create policy "public_detections" on video_detections for select using (is_public = true);
create policy "public_corrections" on correction_packs for select using (true);
create policy "public_claims" on claims for select using (status = 'complete');

-- Evidence: service role only
create policy "service_evidence_read" on evidence_chunks
  for select using (auth.role() = 'service_role');
create policy "service_evidence_write" on evidence_chunks
  for all using (auth.role() = 'service_role');
create policy "service_sources_all" on evidence_sources
  for all using (auth.role() = 'service_role');

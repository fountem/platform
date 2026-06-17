-- Calibrated confidence band, explainability, vendor disagreement, and the
-- human-in-the-loop review queue for video detections.

alter table video_detections
  add column if not exists confidence_low int check (confidence_low between 0 and 100),
  add column if not exists confidence_high int check (confidence_high between 0 and 100),
  add column if not exists vendor_disagreement boolean default false,
  add column if not exists signal_breakdown jsonb,
  add column if not exists review_status text default 'automated'
    check (review_status in ('automated', 'pending_review', 'human_reviewed')),
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewer_notes text;

-- Index to power the review queue (oldest pending first).
create index if not exists idx_detections_review
  on video_detections(review_status, created_at)
  where review_status = 'pending_review';

-- Verdicts: track review status for the Fountem side too.
alter table verdicts
  add column if not exists review_status text default 'automated'
    check (review_status in ('automated', 'pending_review', 'human_reviewed')),
  add column if not exists reviewer_notes text;

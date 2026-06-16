create table evidence_sources (
  id uuid primary key default uuid_generate_v4(),
  source_type text not null check (source_type in (
    'ons', 'ifs', 'hansard', 'full_fact', 'resolution_foundation',
    'nao', 'bbc_reality_check', 'academic', 'government'
  )),
  title text not null,
  url text not null unique,
  publisher text not null,
  published_at date not null,
  retrieved_at timestamptz default now(),
  raw_text text,
  is_active boolean default true
);

create table evidence_chunks (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid references evidence_sources(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  content_tsv tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(1536),
  topic_tags text[] default '{}',
  party_relevance text[] default '{}',
  created_at timestamptz default now()
);

create index idx_chunks_embedding on evidence_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index idx_chunks_fts on evidence_chunks using gin(content_tsv);
create index idx_chunks_source on evidence_chunks(source_id);
create index idx_chunks_topics on evidence_chunks using gin(topic_tags);

-- BM25 search function
create or replace function bm25_search(query_text text, "limit" int)
returns setof evidence_chunks
language sql stable as $$
  select * from evidence_chunks
  where content_tsv @@ plainto_tsquery('english', query_text)
  order by ts_rank(content_tsv, plainto_tsquery('english', query_text)) desc
  limit "limit";
$$;

-- Vector search function
create or replace function vector_search(query_embedding vector(1536), "limit" int)
returns setof evidence_chunks
language sql stable as $$
  select * from evidence_chunks
  order by embedding <=> query_embedding
  limit "limit";
$$;

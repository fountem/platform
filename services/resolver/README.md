# Unfaked Media Resolver

A network-isolated microservice that performs the heavy, native, untrusted work
that must **not** run in the Next.js/serverless tier:

- `yt-dlp` download of social-platform URLs (YouTube / X / TikTok / ~1800 sites)
- SSRF-safe fetching (DNS resolution + private/reserved-range blocking)
- `ffprobe` technical metadata + keyframe-interval extraction
- C2PA Content Credentials extraction (`c2patool`)
- platform metadata (channel, upload date, view count)

It returns a normalised `ResolvedMedia` JSON object that matches the contract in
`packages/detection/src/resolver.ts`. The web app calls it via `RESOLVER_URL` +
`RESOLVER_API_KEY`.

## Local development

```bash
cp .env.example .env   # set RESOLVER_API_KEY
npm install
npm run dev            # tsx watch on :8080
```

You need `ffmpeg`, `yt-dlp`, and (optionally) `c2patool` on your PATH. The
Docker image installs all three.

Test:

```bash
curl -s http://localhost:8080/health
curl -s -X POST http://localhost:8080/resolve \
  -H "authorization: Bearer $RESOLVER_API_KEY" \
  -H 'content-type: application/json' \
  -d '{"url":"https://www.youtube.com/watch?v=..."}' | jq
```

Run unit tests (SSRF guard):

```bash
npm test
```

## Build & push the image

```bash
cd infra && terraform init && terraform apply   # creates ECR + ECS + ALB + Valkey
REPO=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region eu-west-2 | docker login --username AWS --password-stdin "${REPO%/*}"
docker build -t "$REPO:latest" ..
docker push "$REPO:latest"
aws ecs update-service --cluster unfaked-resolver --service unfaked-resolver --force-new-deployment
```

## Terraform

`infra/` provisions: ECR, ECS Fargate cluster/service, an **internal** ALB,
security groups, CloudWatch logs, Secrets Manager (API key), and an ElastiCache
**Valkey** replication group used for rate limiting across the platform.

Required variables (see `variables.tf`): `vpc_id`, `private_subnet_ids`,
`alb_subnet_ids`, `resolver_api_key`.

Outputs: `resolver_url` → set as `RESOLVER_URL` on the web app;
`valkey_url` → set as `VALKEY_URL`.

## Security model

- Service-to-service auth via `RESOLVER_API_KEY` (Bearer, timing-safe compare).
- Deployed in **private subnets** behind an **internal** ALB — not internet-reachable.
- Independent server-side SSRF guard (`src/ssrf.ts`) resolves every hostname and
  rejects loopback/private/link-local/CGNAT/reserved ranges, including the cloud
  metadata IP `169.254.169.254`.
- Commands are spawned with arg arrays (no shell), with hard timeouts, output
  caps, and a 200 MB download ceiling. Runs as a non-root user.

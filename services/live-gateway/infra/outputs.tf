output "ecr_repository_url" {
  value       = aws_ecr_repository.gateway.repository_url
  description = "Push the gateway image here"
}

output "gateway_url" {
  value       = "wss://${aws_lb.public.dns_name}"
  description = "Set NEXT_PUBLIC_LIVE_GATEWAY_URL to this (front with your domain/CDN)"
}

output "alb_dns_name" {
  value = aws_lb.public.dns_name
}

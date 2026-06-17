output "ecr_repository_url" {
  description = "Push the resolver image here."
  value       = aws_ecr_repository.resolver.repository_url
}

output "resolver_url" {
  description = "Internal base URL for the resolver (set as RESOLVER_URL on the web app)."
  value       = "http://${aws_lb.internal.dns_name}"
}

output "valkey_url" {
  description = "Valkey connection string (set as VALKEY_URL on the web app)."
  value       = "rediss://${aws_elasticache_replication_group.valkey.primary_endpoint_address}:6379"
  sensitive   = true
}

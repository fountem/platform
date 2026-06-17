variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-west-2" # London
}

variable "project" {
  description = "Resource name prefix."
  type        = string
  default     = "unfaked-resolver"
}

variable "vpc_id" {
  description = "VPC to deploy the resolver and Valkey into."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for the ECS tasks and ElastiCache (>=2 AZs)."
  type        = list(string)
}

variable "alb_subnet_ids" {
  description = "Subnets for the internal ALB (private; same AZs as tasks)."
  type        = list(string)
}

variable "resolver_api_key" {
  description = "Shared secret for service-to-service auth (stored in Secrets Manager)."
  type        = string
  sensitive   = true
}

variable "desired_count" {
  description = "Number of resolver tasks."
  type        = number
  default     = 2
}

variable "task_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Fargate task memory (MiB)."
  type        = number
  default     = 2048
}

variable "valkey_node_type" {
  description = "ElastiCache (Valkey) node type for rate limiting."
  type        = string
  default     = "cache.t4g.micro"
}

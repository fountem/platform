variable "project" {
  type    = string
  default = "unfaked-live-gateway"
}

variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "alb_subnet_ids" { type = list(string) }

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN for the gateway HTTPS listener"
}

variable "task_cpu" {
  type    = string
  default = "512"
}

variable "task_memory" {
  type    = string
  default = "1024"
}

variable "desired_count" {
  type    = number
  default = 1
}

# App / service config
variable "supabase_url" { type = string }
variable "unfaked_app_url" { type = string }
variable "election_mode" {
  type    = bool
  default = false
}

# Secrets
variable "live_session_signing_key" {
  type      = string
  sensitive = true
}
variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}
variable "deepgram_api_key" {
  type      = string
  sensitive = true
}
variable "openai_api_key" {
  type      = string
  sensitive = true
}
variable "live_internal_key" {
  type      = string
  sensitive = true
}

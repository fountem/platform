terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = var.project
  tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
  # Secrets the task reads from Secrets Manager.
  secrets = {
    LIVE_SESSION_SIGNING_KEY  = var.live_session_signing_key
    SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    DEEPGRAM_API_KEY          = var.deepgram_api_key
    OPENAI_API_KEY            = var.openai_api_key
    LIVE_INTERNAL_KEY         = var.live_internal_key
  }
}

data "aws_vpc" "this" { id = var.vpc_id }

# ─── ECR ────────────────────────────────────────────────────
resource "aws_ecr_repository" "gateway" {
  name                 = local.name
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
  tags = local.tags
}

# ─── Secrets ────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "secret" {
  for_each = local.secrets
  name     = "${local.name}/${each.key}"
  tags     = local.tags
}

resource "aws_secretsmanager_secret_version" "secret" {
  for_each      = local.secrets
  secret_id     = aws_secretsmanager_secret.secret[each.key].id
  secret_string = each.value
}

# ─── Security groups ────────────────────────────────────────
# Internet-facing ALB: browsers open the WebSocket directly.
resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "Public ALB for live-gateway (WebSocket)"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTP (redirect)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

resource "aws_security_group" "task" {
  name        = "${local.name}-task"
  description = "live-gateway ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    description     = "From ALB"
    from_port       = 8090
    to_port         = 8090
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    description = "Outbound: live streams, Deepgram, OpenAI, Supabase, app"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

# ─── IAM ────────────────────────────────────────────────────
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${local.name}-exec"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "secrets" {
  name = "${local.name}-secrets"
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue"]
      Resource = [for s in aws_secretsmanager_secret.secret : s.arn]
    }]
  })
}

resource "aws_iam_role" "task" {
  name               = "${local.name}-task"
  assume_role_policy = data.aws_iam_policy_document.assume.json
  tags               = local.tags
}

# ─── Logs ───────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "gateway" {
  name              = "/ecs/${local.name}"
  retention_in_days = 30
  tags              = local.tags
}

# ─── ECS cluster + task + service ───────────────────────────
resource "aws_ecs_cluster" "this" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = local.tags
}

resource "aws_ecs_task_definition" "gateway" {
  family                   = local.name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name         = "live-gateway"
      image        = "${aws_ecr_repository.gateway.repository_url}:latest"
      essential    = true
      portMappings = [{ containerPort = 8090, protocol = "tcp" }]
      environment = [
        { name = "PORT", value = "8090" },
        { name = "SUPABASE_URL", value = var.supabase_url },
        { name = "UNFAKED_APP_URL", value = var.unfaked_app_url },
        { name = "DEEPGRAM_MODEL", value = "nova-3" },
        { name = "LIVE_ELECTION_MODE", value = var.election_mode ? "1" : "0" },
      ]
      secrets = [for k, s in aws_secretsmanager_secret.secret : { name = k, valueFrom = s.arn }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.gateway.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "gateway"
        }
      }
    }
  ])
  tags = local.tags
}

# ─── Internet-facing ALB (WebSocket-capable) ────────────────
resource "aws_lb" "public" {
  name               = local.name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.alb_subnet_ids
  idle_timeout       = 3600 # long-lived WebSockets
  tags               = local.tags
}

resource "aws_lb_target_group" "gateway" {
  name        = local.name
  port        = 8090
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"
  # Sticky so a session's WS stays on one task.
  stickiness {
    type            = "lb_cookie"
    enabled         = true
    cookie_duration = 3600
  }
  health_check {
    path                = "/health"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }
  tags = local.tags
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.public.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.gateway.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_ecs_service" "gateway" {
  name            = local.name
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.gateway.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.gateway.arn
    container_name   = "live-gateway"
    container_port   = 8090
  }

  depends_on = [aws_lb_listener.https]
  tags       = local.tags
}

terraform {
  required_version = ">= 1.5.0"
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

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# Selecciona la versión de mantenimiento más reciente disponible de MySQL 8.4
# en la región elegida, evitando fijar un parche que pueda dejar de estar disponible.
data "aws_rds_engine_version" "mysql" {
  engine  = "mysql"
  version = "8.4"
  latest  = true
}

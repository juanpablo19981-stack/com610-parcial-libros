variable "aws_region" {
  description = "Región AWS donde se crearán EC2 y RDS."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Nombre o iniciales para identificar los recursos del examen. Usa minúsculas y guiones."
  type        = string
  default     = "com610-libros"
}

variable "vpc_cidr" {
  description = "Bloque IPv4 de la VPC."
  type        = string
  default     = "10.60.0.0/16"
}

variable "ssh_cidr" {
  description = "Tu IP pública en formato CIDR, por ejemplo: 203.0.113.10/32. Nunca uses 0.0.0.0/0 para SSH."
  type        = string
}

variable "public_key_path" {
  description = "Ruta local a tu clave pública SSH .pub; no se sube la clave privada."
  type       = string
  default    = "~/.ssh/com610_ec2.pub"
}

variable "instance_type" {
  description = "Tipo EC2. Verifica precios y elegibilidad Free Tier en tu cuenta/región."
  type       = string
  default    = "t3.micro"
}

variable "db_name" {
  type    = string
  default = "catalogo_libros"
}

variable "db_username" {
  type     = string
  sensitive = true
}

variable "db_password" {
  type     = string
  sensitive = true
}

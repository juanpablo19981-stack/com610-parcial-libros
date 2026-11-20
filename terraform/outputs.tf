output "ec2_public_ip" {
  description = "IP pública de EC2 para SSH y HTTP."
  value       = aws_eip.api.public_ip
}

output "api_url" {
  description = "URL HTTP pública de la API después del despliegue."
  value       = "http://${aws_eip.api.public_ip}"
}

output "rds_endpoint" {
  description = "Endpoint privado de RDS; solo debe configurarse en el entorno de EC2."
  value       = aws_db_instance.mysql.address
}

output "ssh_command" {
  description = "Comando sugerido para conectarse a EC2."
  value       = "ssh -i <RUTA_CLAVE_PRIVADA> ec2-user@${aws_eip.api.public_ip}"
}

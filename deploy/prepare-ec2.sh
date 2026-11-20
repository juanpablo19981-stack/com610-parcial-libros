#!/usr/bin/env bash
set -euo pipefail

# Ejecutar en Amazon Linux 2023 como usuario con sudo.
sudo dnf install -y docker nginx curl
sudo systemctl enable --now docker nginx
sudo mkdir -p /opt/libros-api
sudo chown "$(whoami)":"$(whoami)" /opt/libros-api

if [ ! -f /opt/libros-api/.env ]; then
  install -m 600 /dev/null /opt/libros-api/.env
  echo "Se creó /opt/libros-api/.env vacío. Edítalo y agrega DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME antes del despliegue."
fi

sudo tee /etc/nginx/conf.d/libros-api.conf >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 32k;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX
sudo rm -f /etc/nginx/conf.d/default.conf
sudo nginx -t
sudo systemctl reload nginx

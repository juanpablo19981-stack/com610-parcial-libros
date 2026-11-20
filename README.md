# COM610 — Segundo examen parcial: API REST de libros en AWS

Repositorio público de la solución de los temas 4 y 5. Incluye código, pruebas automatizadas, infraestructura como código, Docker, workflows de GitHub Actions y guía de despliegue.

**Repositorio:** https://github.com/juanpablo19981-stack/com610-parcial-libros

> **Estado:** los archivos fuente y workflows están publicados. La infraestructura EC2/RDS, la API pública, las ejecuciones exitosas de CI/CD y las capturas de evidencias deben completarse en una cuenta AWS real. No se simulan recursos ni capturas.

## 1. Arquitectura

```text
Internet
  | HTTP :80
  v
EC2 (Amazon Linux 2023) -- Nginx :80 -> Docker / Node.js / Express :3000
  |
  | MySQL :3306 (solo red privada / SG de EC2)
  v
RDS MySQL 8.4 (subred privada, sin acceso público)
```

Terraform crea una VPC, subredes públicas y privadas, Internet Gateway, grupos de seguridad, EC2, Elastic IP, RDS y el par de claves públicas. Nginx actúa como proxy inverso. El puerto 3000 solo escucha localmente en EC2; RDS acepta conexiones MySQL únicamente desde el grupo de seguridad de EC2.

## 2. Estructura

- `.github/workflows/ci.yml`: instalación de dependencias y pruebas Jest en `push` y `pull_request` a `main`.
- `.github/workflows/cd.yml`: pruebas, construcción y publicación de imagen en GHCR, despliegue por SSH y verificación con rollback.
- `src/app.js`: endpoints REST y validación HTTP.
- `src/repositories/mysqlBooksRepository.js`: persistencia MySQL con consultas parametrizadas.
- `tests/api.test.js`: pruebas Jest + Supertest con repositorio simulado.
- `db.sql`: creación de la tabla `libros`.
- `terraform/`: infraestructura AWS.
- `Dockerfile`, `nginx-libros.conf`, `deploy/`: empaquetado y preparación de EC2.
- `evidencias/`: lista de capturas reales pendientes.

## 3. Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Estado del servicio y versión |
| GET | `/libros` | Lista de libros |
| GET | `/libros/:id` | Consulta por ID |
| POST | `/libros` | Crea un libro |
| PUT | `/libros/:id` | Actualiza un libro |
| DELETE | `/libros/:id` | Elimina un libro |

Ejemplo de JSON:

```json
{
  "titulo": "Cien años de soledad",
  "autor": "Gabriel García Márquez",
  "anio_publicacion": 1967
}
```

Los campos de texto deben ser no vacíos y el año debe ser un entero entre 0 y el año actual. Las operaciones SQL usan parámetros; no concatenan datos del usuario.

## 4. Ejecutar pruebas localmente

Requiere Node.js 24. Las pruebas no necesitan AWS ni RDS.

```bash
npm install
npm test
```

Para ejecutar la API conectada a una base MySQL local, copia `.env.example` a `.env`, modifica las variables, ejecuta `db.sql` en tu base y usa:

```bash
npm start
curl -i http://localhost:3000/health
curl -i http://localhost:3000/libros
```

Nunca subas el archivo `.env`.

## 5. Crear infraestructura AWS con Terraform

**Antes de ejecutar Terraform:** verifica la región, los costos y los permisos de tu cuenta. EC2, RDS, almacenamiento, transferencia y direcciones IPv4 pueden generar cargos. No se garantiza que los tipos `t3.micro` y `db.t3.micro` sean gratuitos.

Desde `terraform/`:

1. Crea una clave SSH. Conserva la privada en tu equipo:

   ```bash
   ssh-keygen -t ed25519 -C "com610-ec2" -f ~/.ssh/com610_ec2
   ```

2. Copia el archivo de variables y edita todos los valores ficticios:

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

   Define tu IP pública con máscara `/32` en `ssh_cidr`, ruta de la clave pública, usuario y contraseña fuerte de RDS. No uses `0.0.0.0/0` para SSH.

3. Inicializa, valida, revisa el plan y crea recursos:

   ```bash
   terraform init
   terraform fmt -recursive
   terraform validate
   terraform plan
   terraform apply
   ```

4. Consulta los outputs:

   ```bash
   terraform output
   terraform output -raw ec2_public_ip
   terraform output -raw rds_endpoint
   terraform output -raw api_url
   ```

El endpoint de RDS es privado. Configúralo únicamente en EC2.

### Preparar RDS y EC2

En EC2 crea `/opt/libros-api/.env` con permiso `600` y los valores de conexión de RDS. Transfiere `db.sql` a EC2 por SSH y ejecútalo contra el endpoint privado de RDS. No incluyas contraseñas en comandos compartidos ni en capturas.

Asegura que Nginx esté activo y que la tabla `libros` exista antes del primer despliegue. Puedes ejecutar `deploy/prepare-ec2.sh` para preparar Docker/Nginx en Amazon Linux 2023 si fuera necesario.

## 6. Configurar GitHub Actions

En GitHub abre **Settings → Secrets and variables → Actions** y crea los secretos:

| Secret | Contenido |
|---|---|
| `EC2_HOST` | IP pública o DNS de EC2 |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | Clave privada SSH para el despliegue |
| `EC2_FINGERPRINT` | Huella SHA256 verificada de la clave del host EC2 |
| `GHCR_USERNAME` | Usuario GitHub |
| `GHCR_TOKEN` | PAT mínimo con permiso `read:packages` para descargar la imagen GHCR |

No escribas estos valores en los archivos del repositorio. El workflow usa `GITHUB_TOKEN` con permiso `packages: write` para publicar la imagen. EC2 descarga la imagen del paquete GHCR con el secreto `GHCR_TOKEN`.

El CD solo despliega en un `push` a `main`. Antes ejecuta las pruebas, publica la imagen etiquetada con el SHA del commit, actualiza el contenedor y valida `/health` (incluida la versión esperada) y `/libros`. Si la comprobación falla, intenta restaurar la imagen anterior y marca el job como fallido. Los eventos `pull_request` no despliegan.

El primer despliegue requiere que `/opt/libros-api/.env` exista, que RDS esté listo y que Nginx esté activo.

## 7. Verificar CRUD

Después de un despliegue exitoso, usa el output `api_url`:

```bash
export API_URL="http://IP_PUBLICA_EC2"
curl -i "$API_URL/health"
curl -i "$API_URL/libros"

curl -i -X POST "$API_URL/libros" \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Cien años de soledad","autor":"Gabriel García Márquez","anio_publicacion":1967}'

curl -i "$API_URL/libros"
# Reemplaza 1 por el ID devuelto por POST
curl -i -X PUT "$API_URL/libros/1" \
  -H 'Content-Type: application/json' \
  -d '{"titulo":"Cien años de soledad - edición de prueba","autor":"Gabriel García Márquez","anio_publicacion":1967}'
curl -i -X DELETE "$API_URL/libros/1"
```

Verifica que los cambios se reflejen en RDS.

## 8. Evidencias

Agrega capturas reales a `evidencias/` conforme a `evidencias/README.md`: EC2 y su seguridad, RDS privado, operaciones CRUD, persistencia, salida Jest, imagen GHCR y ejecuciones exitosas de CI y CD. Oculta secretos y datos sensibles.

## 9. Seguridad y limpieza

No publiques contraseñas, tokens, claves privadas, `.env`, `terraform.tfvars` ni estados `*.tfstate`. Terraform mantiene datos sensibles en su estado local; protégelo.

Mantén EC2/RDS activos durante la revisión del docente. Una vez concluida, elimina los recursos para evitar cargos:

```bash
cd terraform
terraform destroy
```

**Entrega en eCampus:** únicamente la URL pública de este repositorio. La URL pública de la API y las ejecuciones deben ser reales y comprobadas antes de afirmar que el despliegue está completo.

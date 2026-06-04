# Environment Configuration

## Base Configuration
```
PORT=3000
NODE_ENV=production
```

## Database (Aiven)
```
DB_HOST=mysql-ad17e30-db-render.l.aivencloud.com
DB_PORT=19173
DB_USER=avnadmin
DB_PASS=YOUR_AIVEN_PASSWORD
DB_NAME=defaultdb
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

## JWT
```
JWT_SECRET=tu_clave_secreta_super_segura_cambiar_en_produccion
JWT_EXPIRES_IN=1d
```


---

# 🐳 Docker en Render

## Pasos para desplegar en Render:

### 1. Crear un nuevo servicio web en Render
- Ir a [Render Dashboard](https://dashboard.render.com)
- Click en "New" → "Web Service"
- Conectar tu repositorio de GitHub

### 2. Configurar el servicio
- **Name:** staybooker (o el nombre que prefieras)
- **Environment:** Docker
- **Branch:** main (o tu rama principal)
- **Dockerfile path:** `./Dockerfile`

### 3. Configurar Variables de Entorno
En Render, ve a "Environment" y agrega todas las variables del `.env`:

```
DB_HOST=mysql-ad17e30-db-render.l.aivencloud.com
DB_PORT=19173
DB_USER=avnadmin
DB_PASS=YOUR_AIVEN_PASSWORD
DB_NAME=defaultdb
DB_SYNCHRONIZE=false
DB_LOGGING=false
PORT=3000
JWT_SECRET=tu_clave_secreta_cambiar_aqui
JWT_EXPIRES_IN=1d
MAIL_HOST=smtp.gmail.com
MAIL_USER=tu_email@gmail.com
MAIL_PASSWORD=tu_contraseña_app
MAIL_FROM=noreply@tudominio.com
```

### 4. Configurar el Health Check
- **Health Check Path:** `/` (si tu app tiene un endpoint raíz)
- **Health Check Protocol:** HTTP

### 5. Desplegar
- Click en "Create Web Service"
- Render construirá automáticamente la imagen Docker y la desplegará

---

## 🚀 Comandos locales útiles:

```bash
# Construir la imagen
docker build -t staybooker .

# Ejecutar el contenedor localmente
docker run -p 3000:3000 --env-file .env staybooker

# Usando docker-compose
docker-compose up

# Builds y ejecuta en background
docker-compose up -d

# Ver logs
docker-compose logs -f app

# Detener
docker-compose down
```

---

## ✅ Checklist antes de desplegar

- [ ] `.env` está creado con credenciales correctas de Aiven
- [ ] Dockerfile está en la raíz del proyecto
- [ ] `.gitignore` incluye `.env` (para no pushear secrets)
- [ ] Todas las variables de entorno están configuradas en Render
- [ ] Cambiar `JWT_SECRET` a una clave fuerte en producción
- [ ] Cambiar credenciales SMTP a tu servidor de email

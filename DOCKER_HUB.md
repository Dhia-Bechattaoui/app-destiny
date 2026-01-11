# App Destiny

A modern, high-performance platform for distributing iOS (IPA) and Android (APK) applications.

## 🚀 Quick Start (Zero Config)

The image is pre-configured to run out-of-the-box with a local database and authentication. No external services (like Supabase) are required to get started.

### Option 1: Using `docker-compose.yml` (Recommended)

1. Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: pix3lman/app-destiny:latest
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:password@db:5432/app_distro
      # STORAGE_MODE=local is default if Supabase vars are missing
      - ADMIN_SECRET=change-this-to-a-secure-secret
    depends_on:
      - db
    volumes:
      - app_uploads:/app/public/uploads

  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app_distro
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
  app_uploads:
```

2. Run the application:

```bash
docker-compose up -d
```

### Option 2: Single Command (CLI)

If you prefer to run the containers without a compose file, use this command:

```bash
docker network create app-destiny-network 2>/dev/null || true && \
docker run -d --name app-destiny-db --network app-destiny-network --restart always -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=app_distro -v db_data:/var/lib/postgresql/data postgres:15-alpine && \
docker run -d --name app-destiny --network app-destiny-network -p 3000:3000 -e DATABASE_URL=postgres://postgres:password@app-destiny-db:5432/app_distro -v app_uploads:/app/public/uploads pix3lman/app-destiny:latest
```



Visit [http://localhost:3000](http://localhost:3000).

---

## 🔑 Initial Access

*   **Login URL**: `/login`
*   **Default Email**: `admin@appdestiny.com`
*   **Default Password**: `admin`

> **Note**: These credentials are part of the local database initialization. You can change them later or set `ADMIN_EMAIL` and `ADMIN_PASSWORD` environment variables before the first run.

---

## ☁️ Supabase Configuration (Optional)

To switch from Local Mode to Supabase (for managed Auth and Storage), simply add your keys to the environment variables:

```yaml
environment:
  - NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  - DATABASE_URL=postgres://postgres:... (your supabase connection string)
```

The application will automatically detect these variables and switch authentication and storage providers.

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string for PostgreSQL | Required |
| `ADMIN_SECRET` | Secret key for signing session tokens | `fallback-secret...` |
| `STORAGE_MODE` | File storage backend (`local` or `s3`) | `local` |
| `ADMIN_EMAIL` | Default admin email for setup | `admin@appdestiny.com` |
| `ADMIN_PASSWORD` | Default admin password for setup | `admin` |

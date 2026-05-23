# Intervue Home Server Deployment

Backend deployment follows the same pattern as Omnia:

```text
GitHub-hosted runner
-> validate, build backend Docker image, push to GHCR
-> self-hosted runner on home server
-> pull GHCR image, run Prisma migrations, restart Docker Compose
```

Public ingress still follows the home-server topology:

```text
Cloudflare -> Cloudflare Tunnel -> Nginx Proxy Manager -> backend host port
```

Recommended environments:

| Branch | Server path | Compose project | Backend image | Host port | API hostname |
| --- | --- | --- | --- | --- | --- |
| `dev` | `/home/froztbitez/web-server/intervue/dev` | `intervue-dev` | `ghcr.io/sebastianaben/intervue-api:dev` | `4201` | `api-dev-intervue.albern.space` |
| `main` | `/home/froztbitez/web-server/intervue/main` | `intervue-main` | `ghcr.io/sebastianaben/intervue-api:main` | `4200` | `api-intervue.albern.space` |

## First Server Setup

Install a repository self-hosted runner on the home server:

```bash
cd /tmp
RUNNER_TOKEN=<token-from-github> bash /path/to/intervue/scripts/setup-home-runner.sh
```

The default runner is installed at:

```text
/home/froztbitez/actions-runner-intervue
```

with runner name and label:

```text
intervue-home
```

The deploy workflow targets:

```yaml
runs-on:
  - self-hosted
  - linux
  - x64
  - intervue-home
```

## First Backend Deploy

Run the backend deploy workflow once:

```text
Actions -> Deploy Backend -> Run workflow -> environment: dev
```

The first run creates `.env.server` and stops. Edit it on the server:

```bash
nano /home/froztbitez/web-server/intervue/dev/.env.server
```

For dev, use:

```text
COMPOSE_PROJECT_NAME=intervue-dev
BACKEND_IMAGE=ghcr.io/sebastianaben/intervue-api:dev
BACKEND_HOST_PORT=4201
```

For main, use:

```text
COMPOSE_PROJECT_NAME=intervue-main
BACKEND_IMAGE=ghcr.io/sebastianaben/intervue-api:main
BACKEND_HOST_PORT=4200
```

Use a unique `POSTGRES_PASSWORD` and matching password inside `DATABASE_URL` per environment.

## Frontend

Frontend deployment uses Vercel Git Integration, not GitHub Actions. Connect the GitHub repository in Vercel and configure:

```text
Root Directory: apps/web
```

Set Vercel environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://api-intervue.albern.space/api
```

For preview/dev deployments, use:

```text
NEXT_PUBLIC_API_BASE_URL=https://api-dev-intervue.albern.space/api
```

## Cloudflare Tunnel and NPM

Cloudflare Tunnel public hostname service:

```text
api-dev-intervue.albern.space -> http://172.17.0.1:80
api-intervue.albern.space     -> http://172.17.0.1:80
```

Nginx Proxy Manager proxy hosts:

```text
api-dev-intervue.albern.space -> http://172.17.0.1:4201
api-intervue.albern.space     -> http://172.17.0.1:4200
```

Use `http` from NPM to the backend. Public TLS remains handled by Cloudflare.

## Diagnostics

Health checks from the home server:

```bash
curl -i http://127.0.0.1:4201/api/health
curl -i http://127.0.0.1:4200/api/health
```

Check NPM can reach the backend through Docker host gateway:

```bash
docker exec -it nginxproxymanager sh
curl -i http://172.17.0.1:4201/api/health
curl -i http://172.17.0.1:4200/api/health
```

Check Compose status:

```bash
cd /home/froztbitez/web-server/intervue/dev
docker compose --env-file .env.server -p intervue-dev -f deploy/home-server/docker-compose.server.yml ps

cd /home/froztbitez/web-server/intervue/main
docker compose --env-file .env.server -p intervue-main -f deploy/home-server/docker-compose.server.yml ps
```

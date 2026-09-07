# Getting Set Up

This is a guide for getting your own instance of Splitty Test up and running so you can begin testing. Remember to review the [license](license.html) information before spinning it up.

Splitty Test is distributed as a source-available project. We want everyone to be able to use Splitty Test free-of-charge for personal or commercial use, but we want to protect our exclusive right to offer support and hosting as a service in the future. If you're interested in offering Splitty Test as a hosted service, you can [reach out to us](mailto:partners@splittytest.com).

## Prerequisites
* Clickhouse
* Postgres
* Redis

## Database Migrations

You can run the database migrations using **NPM**.

1. Change the working directory to the `api` folder.
```bash
$ cd path/to/splitty-test/api
```

2. Run the migrate script for the database you are using.
```bash
$ npm run migrate:postgres
$ npm run migrate:clickhouse
```

## Docker

A single image runs the API and serves the built UI. It also runs the database migrations. Build it from the repository root:

```bash
$ docker build -f ops/containers/Dockerfile -t splittytest .
```

The container reads its configuration from environment variables (see [Configuration](#configuration)). The first argument selects what to run:

| Command | What it does |
|---------|--------------|
| `api` (default) | Starts the API on port 3000 and serves the UI |
| `migrate` | Runs the store migrations, then the OLAP migrations |
| `migrate:store` | Runs only the Postgres/SQLite migrations |
| `migrate:olap` | Runs only the ClickHouse/DuckDB migrations |

```bash
$ docker run --rm --env-file .env splittytest migrate
$ docker run -d --env-file .env -p 3000:3000 splittytest
```

`GET /healthz` returns `200` when the API is up and can reach Redis, and `503` otherwise.

### Docker Compose

`docker-compose.yml` in the repository root starts Postgres, ClickHouse, Redis, runs the migrations, and then starts the API on [http://localhost:3000](http://localhost:3000).

```bash
$ cp .env.example .env     # set the secrets and passwords
$ docker compose up --build
```

Log in with `admin@splittytest.com` / `password` unless you set `INIT_USER` in `.env` before the first run. Change the password immediately.

Compose defaults `NODE_ENV` to `local` so that login cookies work over plain http. `NODE_ENV=production` marks session cookies as secure and enforces the per-API-key CORS whitelist, so only use it behind TLS.

## Helm

The chart in `ops/charts/splittytest` deploys the image to Kubernetes. It expects Postgres, ClickHouse, and Redis to already exist in the cluster (or elsewhere); it does not deploy them. Migrations run as a Helm hook Job before the app pods roll out on upgrades (and right after the first install).

1. Build and push the image to a registry your cluster can pull from.
```bash
$ docker build -f ops/containers/Dockerfile -t registry.example.com/splittytest:1.0.0 .
$ docker push registry.example.com/splittytest:1.0.0
```

2. Create a values file with your connection details and secrets.
```yaml
image:
  repository: registry.example.com/splittytest
  tag: "1.0.0"
config:
  appUrl: https://splittytest.example.com
  store:
    postgres:
      host: postgres.postgres.svc.cluster.local
  olap:
    clickhouse:
      url: http://clickhouse.clickhouse.svc.cluster.local:8123
  redis:
    host: redis.redis.svc.cluster.local
secrets:
  authSecret: "<openssl rand -hex 32>"
  sessionSecret: "<openssl rand -hex 32>"
  postgresPassword: "..."
  clickhousePassword: "..."
ingress:
  enabled: true
  className: traefik
  hosts:
    - host: splittytest.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: splittytest-tls
      hosts:
        - splittytest.example.com
```

Instead of putting secrets in the values file, set `secrets.existingSecret` to the name of a Secret containing `AUTH_SECRET`, `SESSION_SECRET`, `POSTGRES_PASSWORD`, `CLICKHOUSE_PASSWORD` (and optionally `REDIS_PASSWORD`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `INIT_USER`).

3. Install or upgrade.
```bash
$ helm upgrade --install splittytest ops/charts/splittytest \
    --namespace splittytest --create-namespace \
    --values my-values.yaml
```

Uploaded images are stored on the pod filesystem under `/app/public/uploads`; enable `persistence` in the values to keep them across restarts.

## Configuration

All settings live in `api/config/default.js` and can be overridden with environment variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_ENV` | | `production` enables secure cookies, CORS whitelists, and bot filtering; `dev` disables serving the UI |
| `PORT` | `3000` | API listen port |
| `APP_URL` | `http://localhost:3001` | Public URL used in emails |
| `AUTH_SECRET` | | Secret for signing authentication tokens (required) |
| `SESSION_SECRET` | `test-secret` | Secret for signing session cookies |
| `STORE_TYPE` | `postgres` | Transactional store: `postgres` or `sqlite` |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE` | `localhost`, `5432`, `postgres`, , `splittytest` | Postgres connection |
| `SQLITE_PATH` | `~/.local/share/splittytest/sqlite.db` | SQLite file when `STORE_TYPE=sqlite` |
| `OLAP_TYPE` | `clickhouse` | Analytics store: `clickhouse` or `duckdb` |
| `CLICKHOUSE_URL`, `CLICKHOUSE_USERNAME`, `CLICKHOUSE_PASSWORD`, `CLICKHOUSE_DATABASE` | `http://localhost:8123`, `default`, `default`, `splittytest` | ClickHouse connection |
| `DUCKDB_PATH` | `~/.local/share/splittytest/duck.db` | DuckDB file when `OLAP_TYPE=duckdb` |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` | `localhost`, `6379` | Redis connection (cache, sessions, queues; needs the JSON module, e.g. Redis 8 or redis-stack) |
| `UI_PATH` | `ui/dist` | Directory of the built UI to serve |
| `INIT_USER` | | JSON overriding the seeded admin user, applied by the first store migration |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` | | Outbound email (see below) |

## Using MailGun

Coming soon...

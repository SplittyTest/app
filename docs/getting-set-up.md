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

The easiest way to run Splitty Test is with [Docker Compose](https://docs.docker.com/compose/). The `docker-compose.yml` at the root of the repository starts everything you need:

| Service | What it does |
| --- | --- |
| `app` | The API, which also serves the built UI, on port `3000` |
| `postgres` | The main data store |
| `redis` | Sessions, cache and buffers (uses Redis Stack for RedisJSON) |
| `clickhouse` | Event and session metrics |
| `migrate-store` | Runs the Postgres migrations, then exits |
| `migrate-metrics` | Runs the ClickHouse migrations, then exits |

The migrations run every time the stack starts. Migrations that have already run are skipped, so this is safe.

### Requirements
* Docker with Docker Compose v2 (Docker Desktop includes both)

### 1. Configure your environment

Create a `.env` file next to `docker-compose.yml`. The quickest way is to copy the example:

```bash
$ cd path/to/splitty-test
$ cp .env.example .env
```

| Variable | Default | Description |
| --- | --- | --- |
| `AUTH_SECRET` | `change-me-auth-secret` | Secret used to sign auth tokens |
| `SESSION_SECRET` | `change-me-session-secret` | Secret used to sign session cookies |
| `POSTGRES_PASSWORD` | `postgres` | Password for the Postgres `postgres` user |
| `CLICKHOUSE_PASSWORD` | `default` | Password for the ClickHouse `default` user |
| `MAILGUN_API_KEY` | `unset` | Mailgun API key, needed for emails like password resets |
| `MAILGUN_DOMAIN` | `unset` | Mailgun sending domain |
| `APP_PORT` | `3000` | Port the app is published on |
| `APP_URL` | `http://localhost:3000` | Public URL of the app, used for links in emails |
| `INIT_USER` | _(none)_ | JSON that overrides the first admin user (see below) |

Every variable has a default, so you can skip the `.env` file for a quick local try. **Always set your own `AUTH_SECRET`, `SESSION_SECRET` and database passwords for anything other than local use.**

::: warning
The database passwords only take effect the first time their volumes are created. If you change them later, also update the password inside the database, or remove the volumes (see [Resetting everything](#resetting-everything)).
:::

### 2. Start the stack

```bash
$ docker compose up --build -d
```

The first build takes a few minutes. Follow progress with:

```bash
$ docker compose logs -f app
```

When the `app` container is running, open [http://localhost:3000](http://localhost:3000).

### 3. Sign in

The first migration creates an admin user:

* **Email:** `admin@splittytest.com`
* **Password:** generated during the first migration and printed in its output (for Docker Compose: `docker compose logs migrate-store`). Set `INIT_USER` before the first run to choose your own.

Change this password right after you sign in. You can also choose the first user's details before the first run by setting `INIT_USER` in your `.env` file:

```bash
INIT_USER={"email":"me@example.com","password":"a-strong-password","first_name":"Jane","last_name":"Doe"}
```

`INIT_USER` is only used when the migrations run against an empty database.

### Common commands

```bash
# Stop the stack (data is kept)
$ docker compose down

# Rebuild after pulling new code (also runs any new migrations)
$ docker compose up --build -d

# See the status of every service
$ docker compose ps

# Run the migrations again by hand
$ docker compose run --rm migrate-store
$ docker compose run --rm migrate-metrics
```

### Data and uploads

Data is kept in named Docker volumes, so it survives restarts and rebuilds:

* `postgres-data`, `redis-data` and `clickhouse-data` hold the databases
* `uploads` holds uploaded images, which are served from `/uploads`

#### Resetting everything

To delete all data and start fresh:

```bash
$ docker compose down -v
```

### Developing against the Docker services

To run the API or UI with `npm run dev` while using the Docker databases, uncomment the `ports:` lines for `postgres`, `redis` and `clickhouse` in `docker-compose.yml`. Then start only those services:

```bash
$ docker compose up -d postgres redis clickhouse migrate-store migrate-metrics
```

The API's default config already points at `localhost`, so it connects to them without further changes.

### Running in production

The compose file is set up for local use over plain HTTP. Before you expose it publicly:

* Put the app behind a reverse proxy that handles HTTPS.
* Set `NODE_ENV=production` on the `app` service. This turns on secure-only session cookies and restricts CORS to each API key's domain whitelist. Login won't work over plain HTTP once this is set.
* Set strong values for every secret and password in `.env`, and set `APP_URL` to your public URL.
* Set real Mailgun credentials so password reset emails can be sent.

## Helm

To run Splitty Test on Kubernetes, use the Helm chart in `ops/charts/splittytest`. One install sets up:

| Resource | What it does |
| --- | --- |
| Deployment `<release>-splittytest` | The API, which also serves the built UI |
| Job `<release>-splittytest-migrate` | Runs the Postgres and ClickHouse migrations after every install and upgrade |
| StatefulSet `…-postgresql` | Postgres 17 (optional) |
| StatefulSet `…-redis` | Redis Stack, for RedisJSON (optional) |
| StatefulSet `…-clickhouse` | ClickHouse 25.8 (optional) |
| Secret | Auth/session secrets, database passwords and Mailgun credentials |
| PersistentVolumeClaim `…-uploads` | Uploaded images |
| Ingress or HTTPRoute | Public access (optional) |

### Requirements
* Kubernetes 1.25+ with a default StorageClass
* Helm 3
* A container registry your cluster can pull from

### 1. Build and push the images

The chart uses two images: the app, and the migrator that runs the database migrations. Build both from the root of the repository:

```bash
$ docker build -f ops/containers/Dockerfile          -t <registry>/splittytest:1.0.0-beta1 .
$ docker build -f ops/containers/Dockerfile.migrator -t <registry>/splittytest-migrator:1.0.0-beta1 .
$ docker push <registry>/splittytest:1.0.0-beta1
$ docker push <registry>/splittytest-migrator:1.0.0-beta1
```

::: tip
Most clusters run on `amd64`. On an Apple Silicon Mac, build with `docker buildx build --platform linux/amd64 ...` so the images run on your nodes.
:::

By default the image tag matches the chart's `appVersion` (`1.0.0-beta1`). To use another tag, set `image.tag`. The migrator uses the same tag unless you set `migrator.image.tag`.

### 2. Create a values file

Put your settings in a file, for example `my-values.yaml`:

```yaml
image:
  repository: <registry>/splittytest
migrator:
  image:
    repository: <registry>/splittytest-migrator

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
  hosts:
    - host: splittytest.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: splittytest-tls
      hosts:
        - splittytest.example.com

mailgun:
  apiKey: <your mailgun api key>
  domain: mg.example.com
```

If your registry needs credentials, add them with `imagePullSecrets`.

### 3. Install

```bash
$ helm install splittytest ./ops/charts/splittytest \
    --namespace splittytest --create-namespace \
    -f my-values.yaml
```

The databases start first, then the migration Job runs. You can follow it with:

```bash
$ kubectl -n splittytest logs -f job/splittytest-migrate
```

When it finishes, open your ingress host and sign in as `admin@splittytest.com` with the generated password printed in the migration job's logs (`kubectl logs job/<release>-migrate`). Change the password right away. To choose the first user yourself, set `migrator.initUser` before the first install:

```yaml
migrator:
  initUser: '{"email":"me@example.com","password":"a-strong-password","first_name":"Jane","last_name":"Doe"}'
```

### HTTPS and `app.nodeEnv`

`app.nodeEnv` defaults to `production`. In production mode the app:
* only sends session cookies over HTTPS
* only allows cross-origin requests from the domains whitelisted on each API key

So the app has to be served over HTTPS, for example through an Ingress with TLS. To try it over plain HTTP with a port-forward, turn production mode off:

```bash
$ helm install splittytest ./ops/charts/splittytest -f my-values.yaml --set app.nodeEnv=""
$ kubectl -n splittytest port-forward svc/splittytest 3000:80
```

Then open [http://localhost:3000](http://localhost:3000).

### Secrets

On first install the chart generates `AUTH_SECRET`, `SESSION_SECRET` and the Postgres and ClickHouse passwords. It keeps them on every upgrade. You can also set them yourself with `secrets.authSecret`, `secrets.sessionSecret`, `postgresql.password` and `clickhouse.password`.

To manage the secrets yourself (with External Secrets or Sealed Secrets, for example), create a Secret with these keys and set `secrets.existingSecret` to its name:

| Key | Required |
| --- | --- |
| `AUTH_SECRET` | Yes |
| `SESSION_SECRET` | Yes |
| `POSTGRES_PASSWORD` | Yes |
| `CLICKHOUSE_PASSWORD` | Yes |
| `MAILGUN_API_KEY` | Yes (any placeholder works if you don't send email) |
| `MAILGUN_DOMAIN` | Yes (any placeholder works if you don't send email) |
| `REDIS_PASSWORD` | Only if your Redis requires one |

```bash
$ kubectl -n splittytest create secret generic splittytest-secrets \
    --from-literal=AUTH_SECRET=$(openssl rand -hex 32) \
    --from-literal=SESSION_SECRET=$(openssl rand -hex 32) \
    --from-literal=POSTGRES_PASSWORD=<password> \
    --from-literal=CLICKHOUSE_PASSWORD=<password> \
    --from-literal=MAILGUN_API_KEY=<key> \
    --from-literal=MAILGUN_DOMAIN=<domain>
```

::: warning
The bundled Postgres and ClickHouse set their passwords only when their volumes are first created. Changing the password in the Secret later doesn't change it in the database.
:::

### Using external databases

The bundled databases each run as a single node, which suits small installs. For production you can use managed services instead. Disable each bundled database and point the chart at your own:

```yaml
postgresql:
  enabled: false
  host: my-postgres.example.com
  port: 5432
  username: splittytest
  database: splittytest
  password: <password>        # or POSTGRES_PASSWORD in secrets.existingSecret

redis:
  enabled: false
  host: my-redis.example.com
  port: 6379
  password: <password>        # optional

clickhouse:
  enabled: false
  url: https://my-clickhouse.example.com:8443
  username: default
  database: splittytest
  password: <password>        # or CLICKHOUSE_PASSWORD in secrets.existingSecret
```

Make sure that:
* the Postgres and ClickHouse databases exist before you install, since the migrations create tables but not the databases
* Redis has the **RedisJSON** module (Redis Stack, Redis 8+, or Valkey with valkey-json)
* ClickHouse is version **25.3 or newer**, for the `JSON` column type

### Scaling

Sessions are stored in Redis, so you can run several app replicas. Uploaded images are stored on a volume, though. The default `ReadWriteOnce` volume can only attach to one node, so for more than one replica:

```yaml
replicaCount: 3
app:
  uploads:
    persistence:
      accessMode: ReadWriteMany
      storageClass: <an RWX storage class, e.g. efs or nfs>
```

With a `ReadWriteOnce` uploads volume, the chart stops the old pod before starting the new one on each upgrade, so expect a few seconds of downtime per upgrade.

### Upgrading

Build and push new images, then upgrade with the new tag:

```bash
$ helm upgrade splittytest ./ops/charts/splittytest -n splittytest \
    -f my-values.yaml --set image.tag=<new tag>
```

The migration Job runs again after each upgrade and applies any new migrations.

### Other settings

| Value | Default | Description |
| --- | --- | --- |
| `app.url` | first ingress host | Public URL, used in links in emails |
| `app.apiSessionMaxAge` | 1 hour | Lifetime of API key sessions, in milliseconds |
| `app.nodeConfig` | `{}` | Extra [node-config](https://github.com/node-config/node-config) settings, merged over `api/config/default.js` |
| `app.extraEnv` | `[]` | Extra environment variables for the app and migrations |
| `app.uploads.persistence.*` | 5Gi, RWO | Storage for uploaded images |
| `*.persistence.size` | 8Gi / 2Gi / 20Gi | Volume size for Postgres / Redis / ClickHouse |
| `resources`, `*.resources` | none | CPU and memory requests and limits |
| `autoscaling.*` | disabled | Horizontal pod autoscaling |
| `httpRoute.*` | disabled | Gateway API route, instead of an Ingress |

For example, to log less and change the sender address on emails:

```yaml
app:
  nodeConfig:
    log:
      level: info
    email:
      from: "Acme Experiments <no-reply@acme.com>"
      reply_to: "Acme Experiments <no-reply@acme.com>"
```

See `ops/charts/splittytest/values.yaml` for every option.

### Uninstalling

```bash
$ helm uninstall splittytest -n splittytest
```

To protect your data, uninstalling doesn't delete:
* the Secret
* the uploads volume
* the database volumes (`data-*` PersistentVolumeClaims)

To remove everything for good:

```bash
$ kubectl -n splittytest delete secret splittytest
# Removes the uploads volume and all database volumes
$ kubectl -n splittytest delete pvc -l app.kubernetes.io/instance=splittytest
```

## Configuration

Coming soon...

## Using MailGun

Coming soon...

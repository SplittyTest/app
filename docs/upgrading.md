# Upgrading

Upgrading Splitty Test means getting the new code, rebuilding, and running any new database migrations. Migrations that have already run are skipped, so running them again is safe.

::: warning
Splitty Test is in alpha. Back up your Postgres and ClickHouse data before upgrading, and check the release notes for breaking changes.
:::

## Docker Compose

From the repository root, pull the new code and rebuild:

```bash
$ git pull
$ docker compose up --build -d
```

The `migrate-store` and `migrate-metrics` services run any new migrations before the app starts. To confirm they succeeded:

```bash
$ docker compose logs migrate-store migrate-metrics
```

Your data lives in Docker volumes and is kept across upgrades.

## Helm

Build and push images with the new version tag (see [Build and push the images](/getting-set-up#_1-build-and-push-the-images)), then upgrade the release:

```bash
$ helm upgrade splittytest ./ops/charts/splittytest -n splittytest \
    -f my-values.yaml --set image.tag=<new tag>
```

The migration Job runs after every upgrade. Follow it with:

```bash
$ kubectl -n splittytest logs -f job/splittytest-migrate
```

Secrets generated at install time are kept. If your uploads volume is `ReadWriteOnce`, expect a few seconds of downtime while the old pod stops; see [Scaling](/getting-set-up#scaling).

## From Source

```bash
$ git pull

# API
$ cd api
$ npm install
$ npm run migrate:postgres
$ npm run migrate:clickhouse
$ npm run build

# UI
$ cd ../ui
$ npm install
$ npm run build
```

Then restart the API.

## If Something Goes Wrong

* **Migrations failed:** check the migration logs for the error. Fix the cause (often a database connection or password issue) and run the migrations again.
* **App won't start in production:** make sure `SESSION_SECRET` is set to a strong value; the API refuses to start without one. See [Environment variables](/getting-set-up#environment-variables).
* **Need to go back:** redeploy the previous version and restore your backup. Migrations aren't automatically reversed.

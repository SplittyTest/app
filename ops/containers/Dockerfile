# syntax=docker/dockerfile:1.7
#
# SplittyTest application image: Express API + built Vue UI in one container.
# The same image also runs database migrations (see docker-entrypoint.sh):
#
#   docker build -f ops/containers/Dockerfile -t splittytest .
#   docker run --rm --env-file .env splittytest migrate       # run store + OLAP migrations
#   docker run --rm --env-file .env -p 3000:3000 splittytest  # start the API (serves the UI)
#
# Build context must be the repository root.

ARG NODE_VERSION=22

# ---------------------------------------------------------------------------
# UI build
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm AS ui-build
WORKDIR /ui
COPY ui/package.json ui/package-lock.json ./
RUN npm ci
COPY ui/ ./
# The UI is served by the API from the same origin, so API calls are relative.
ARG VITE_API_URL=/
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---------------------------------------------------------------------------
# API build (needs devDependencies for tsc / eslint)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm AS api-build
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci
COPY api/ ./
RUN npm run build \
    && npm prune --omit=dev

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime

ENV NODE_ENV=production \
    UI_PATH=/app/ui/dist \
    PORT=3000

WORKDIR /app

# tsx runs the TypeScript migrations without devDependencies or a compile step.
RUN npm install -g tsx@4 && npm cache clean --force

# Production node_modules (native modules: bcrypt, better-sqlite3, duckdb) and compiled API.
COPY --from=api-build --chown=node:node /app/node_modules ./node_modules
COPY --from=api-build --chown=node:node /app/dist ./dist

# Runtime config + sources needed by the migrator (migrate/ imports src/lib/DB).
COPY --chown=node:node api/package.json api/tsconfig.json ./
COPY --chown=node:node api/config ./config
COPY --chown=node:node api/migrate ./migrate
COPY --chown=node:node api/src ./src

# Built UI, served by the API as static files.
COPY --from=ui-build --chown=node:node /ui/dist ./ui/dist

# Local upload storage (mount a volume here to persist uploads).
RUN mkdir -p /app/public/uploads && chown -R node:node /app/public

COPY --chmod=755 ops/containers/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

USER node
EXPOSE 3000
VOLUME ["/app/public/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["api"]

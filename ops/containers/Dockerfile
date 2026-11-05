# syntax=docker/dockerfile:1.7
#
# One Dockerfile, two images:
#   docker build -f ops/containers/Dockerfile --target app      -t splittytest/app .
#   docker build -f ops/containers/Dockerfile --target migrator -t splittytest/migrator .
#
# Why it's fast:
#  - Dependencies are installed from package.json + package-lock.json only, so
#    editing source code never re-runs `npm ci`.
#  - The API dependency install is shared by the app and migrator images.
#  - API and UI build in parallel stages; npm's download cache persists between
#    builds via a BuildKit cache mount.

ARG NODE_VERSION=26

# ---------------------------------------------------------------------------
# Toolchain (full image: has python3/make/g++ in case a native module needs
# to compile because no prebuilt binary matches this Node version)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie AS toolchain

# Newer npm than the one bundled with Node (honours "allowScripts")
ARG NPM_VERSION=latest
RUN --mount=type=cache,target=/root/.npm npm install -g npm@${NPM_VERSION}

ENV npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false

# ---------------------------------------------------------------------------
# API dependencies (all, incl. dev) — rebuilt only when the lockfile changes
# ---------------------------------------------------------------------------
FROM toolchain AS api-deps
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Production-only node_modules, derived from the layer above (no reinstall)
FROM api-deps AS api-prod-deps
RUN npm prune --omit=dev --legacy-peer-deps

# ---------------------------------------------------------------------------
# API build
# ---------------------------------------------------------------------------
FROM api-deps AS api-build
COPY api/ ./
# Call tsc directly: `npm run build` would also trigger prebuild (clean + eslint)
RUN npx tsc -p tsconfig.json && npx tsc-alias -p tsconfig.json

# ---------------------------------------------------------------------------
# UI dependencies + build
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie AS ui-deps
WORKDIR /app/ui
ENV npm_config_fund=false npm_config_audit=false npm_config_update_notifier=false
COPY ui/package.json ui/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

FROM ui-deps AS ui-build
COPY ui/ ./
# Plain `vite build`: skips the vue-tsc type-check pass that `npm run build`
# does (run that in CI / locally instead of on every image build)
RUN VITE_API_URL=/ npx vite build

# ---------------------------------------------------------------------------
# Migrator image — runs migrations with ts-node, so it needs dev deps + source
# ---------------------------------------------------------------------------
FROM api-deps AS migrator
COPY api/ ./
ENTRYPOINT ["npm", "run"]

# ---------------------------------------------------------------------------
# App image — slim runtime with only what the server needs
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-trixie-slim AS app
WORKDIR /app

COPY --from=api-prod-deps /app/api/node_modules ./node_modules
COPY api/package.json ./
COPY api/config ./config
COPY --from=api-build /app/api/dist ./dist
# tsc doesn't copy non-TS assets; the mailer reads these relative to dist/
COPY api/src/lib/Mail/templates ./dist/lib/Mail/templates
COPY --from=ui-build /app/ui/dist ./ui/dist

ENV UI_PATH=/app/ui/dist
EXPOSE 3000
CMD ["node", "dist/server.js"]

# syntax=docker/dockerfile:1.7
# ──────────────────────────────────────────────────────────────────────
#  G-Lab Backend — multi-stage Dockerfile (production-ready, non-root).
#  Build:  docker build -t g-lab-backend .
#  Run:    docker run --rm -p 4000:4000 --env-file .env g-lab-backend
# ──────────────────────────────────────────────────────────────────────

# ────────── 1) deps ──────────
FROM node:20-bookworm-slim AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --include=dev; else npm install --include=dev; fi

# ────────── 2) build ──────────
FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ────────── 3) prod-deps (bez devDependencies) ──────────
FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ────────── 4) runtime ──────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    HOST=0.0.0.0

# sharp ma pre-built binaries — nic dodatkowego do instalacji.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

# Non-root user.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --create-home --shell /bin/bash glab

COPY --from=prod-deps --chown=glab:nodejs /app/node_modules ./node_modules
COPY --from=build     --chown=glab:nodejs /app/dist          ./dist
COPY --chown=glab:nodejs package.json ./

USER glab
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+ (process.env.PORT||4000) +'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "dist/server.js"]

# syntax=docker/dockerfile:1.7
# ─── ADPVO — image de production ────────────────────────────────────────────
# Cibles :
#   runner   (défaut) serveur Next.js autonome, utilisateur non root
#   migrator migrations SQL et scripts d'exploitation (admin:create, maintenance:cleanup)

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Aucun secret n'est nécessaire au build : l'environnement est validé à l'exécution.
RUN pnpm build

# Outils d'exploitation : migrations, création d'administrateur, maintenance.
FROM deps AS migrator
COPY . .
CMD ["pnpm", "db:migrate"]

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
RUN groupadd --system --gid 1001 app && useradd --system --uid 1001 --gid app app
COPY --from=build --chown=app:app /app/.next/standalone ./
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# FlowReview API image. Build context is the repository root (monorepo).
FROM node:20-alpine

RUN corepack enable
WORKDIR /app

# Workspace manifests first for better layer caching.
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --prod=false
RUN pnpm --filter @flow-review/api db:generate
RUN pnpm --filter @flow-review/api build

ENV NODE_ENV=production
EXPOSE 4000

# Apply migrations, optionally seed (SEED=true), then start the API.
CMD ["sh", "-c", "pnpm --filter @flow-review/api db:migrate && if [ \"$SEED\" = \"true\" ]; then pnpm --filter @flow-review/api db:seed; fi && node apps/api/dist/server.js"]

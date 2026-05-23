FROM node:24-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/shared packages/shared

RUN pnpm --filter @intervue/api db:generate
RUN pnpm --filter @intervue/api build

EXPOSE 4000

CMD ["pnpm", "--filter", "@intervue/api", "exec", "tsx", "src/server.ts"]

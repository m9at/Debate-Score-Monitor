# Production image: Express API + built Vite web client in a single service.
FROM node:24-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@10

WORKDIR /app

COPY . .

# Vite reads these at build time (vite.config.ts requires them).
ENV NODE_ENV=development
ENV BASE_PATH=/
ENV PORT=3000

# Clerk publishable key is baked into the client bundle at build time.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @workspace/web run build \
  && pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV WEB_DIST=/app/artifacts/web/dist/public

EXPOSE 3000

# Sync the database schema, then start the server.
CMD ["sh", "-c", "pnpm --filter @workspace/db run push && node artifacts/api-server/dist/index.mjs"]

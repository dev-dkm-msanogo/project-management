# Image de l'API (Fastify) : compilation avec tsup, exécution avec les seules dépendances de production.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace @gdp/backend --include-workspace-root=false
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN npm run build --workspace @gdp/backend

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --omit=dev --workspace @gdp/backend --include-workspace-root=false \
  && npm cache clean --force
COPY --from=build /app/packages/backend/dist packages/backend/dist
USER node
EXPOSE 3001
CMD ["node", "packages/backend/dist/main.js"]

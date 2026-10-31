# Image du frontend : build Vite servi par nginx, qui relaie /api vers le conteneur de l'API.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace @gdp/frontend --include-workspace-root=false
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend
# API servie par la même origine (relais nginx) : URL relative, ni CORS ni cookie tiers.
RUN printf 'VITE_API_URL=\n' > packages/frontend/.env.production \
  && npm run build --workspace @gdp/frontend

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
EXPOSE 80

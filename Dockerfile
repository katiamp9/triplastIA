FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM node:20-alpine AS runtime
WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 10000
CMD ["sh", "-c", "APP_DIR=\"$(dirname \"$(find /app/dist -type f -name index.html | head -n 1)\")\" && exec serve -s \"$APP_DIR\" -l \"${PORT:-10000}\""]
FROM node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS base

WORKDIR /apps

RUN apt-get update \
 && apt-get install -y --no-install-recommends netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

FROM base AS migration

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .

USER node

CMD ["npx", "sequelize-cli", "db:migrate"]

FROM base AS production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

RUN mkdir -p /apps/uploads /apps/logs \
 && chown -R node:node /apps/uploads /apps/logs

USER node

EXPOSE 3003

CMD ["sh", "-c", "until nc -z mysql 3306; do sleep 1; done; node app.js"]

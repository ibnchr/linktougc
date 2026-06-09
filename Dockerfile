FROM --platform=linux/amd64 node:20-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=optional

COPY . .
ENV NODE_OPTIONS="--max-old-space-size=256"
RUN npm run build
RUN mkdir -p public/generated

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache ffmpeg ca-certificates

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV NODE_ENV=production
ENV VEO_MOCK=true
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]

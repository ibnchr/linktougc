FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=optional

COPY . .
RUN mkdir -p public/generated
ENV NODE_OPTIONS="--max-old-space-size=384"
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV VEO_MOCK=true

CMD ["npx", "next", "start", "-H", "0.0.0.0"]
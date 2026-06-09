FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN mkdir -p public/generated

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV VEO_MOCK=true

CMD ["npx", "next", "start"]

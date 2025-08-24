### Multi-stage Dockerfile for Next.js standalone output
### Builds the app and runs the standalone server (server.js) produced at .next/standalone

FROM node:20-alpine AS builder
WORKDIR /app

# Install build deps
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy sources and build
COPY . .
RUN npm run build

### Runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone build produced by Next.js
COPY --from=builder /app/.next/standalone/ ./

# Copy public static assets (optional, included in standalone but keep for clarity)
COPY --from=builder /app/public ./public

EXPOSE 3000

# Start the standalone server
CMD ["node", "server.js"]

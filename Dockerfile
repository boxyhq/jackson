# Install dependencies only when needed
FROM node:16.9.1-alpine3.14 AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY src/ src/
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Production image, copy all the files and run next
FROM node:16.9.1-alpine3.14 AS runner
WORKDIR /app

ENV NODE_OPTIONS="--max-http-header-size=81920"
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

COPY --from=deps /app/src ./src
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

USER nodejs

EXPOSE 5000
EXPOSE 6000

CMD [ "node", "src/jackson.js" ]

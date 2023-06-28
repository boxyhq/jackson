ARG NODEJS_IMAGE=node:18.16.1-alpine3.18
FROM --platform=$BUILDPLATFORM $NODEJS_IMAGE AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json  ./
COPY npm npm
COPY bootstrap.sh bootstrap.sh
RUN npm run custom-install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/npm ./npm
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/bootstrap.sh ./bootstrap.sh
COPY . .


# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM $NODEJS_IMAGE AS runner
WORKDIR /app

ENV NODE_OPTIONS="--max-http-header-size=81920 --dns-result-order=ipv4first"


ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs


COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/bootstrap.sh ./bootstrap.sh
COPY --from=builder /app/npm ./npm
RUN chmod +x bootstrap.sh
RUN npm install -g ts-node migrate-mongo

USER nextjs

EXPOSE 5225

ENV PORT 5225
CMD ["/bin/sh", "bootstrap.sh"]

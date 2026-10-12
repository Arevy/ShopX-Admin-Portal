FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

FROM dependencies AS development
COPY . .
EXPOSE 3000
CMD ["yarn", "dev", "--hostname", "0.0.0.0"]

FROM dependencies AS build
COPY . .
ARG NEXT_PUBLIC_GRAPHQL_ENDPOINT=/api/support-graphql
ARG NEXT_PUBLIC_USE_SUPPORT_SERVICES=true
ENV NEXT_PUBLIC_GRAPHQL_ENDPOINT=${NEXT_PUBLIC_GRAPHQL_ENDPOINT}
ENV NEXT_PUBLIC_USE_SUPPORT_SERVICES=${NEXT_PUBLIC_USE_SUPPORT_SERVICES}
RUN yarn build

FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile && yarn cache clean

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3000"]

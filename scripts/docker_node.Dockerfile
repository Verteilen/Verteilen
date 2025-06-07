FROM node:22.10-slim AS builder
WORKDIR /app/

COPY . .

RUN npm install -g bun
RUN bun install
RUN bun run build:node

FROM node:22.10-alpine
WORKDIR /app/
EXPOSE 12080

COPY --from=builder /app/build/node /app/
RUN npm install -g bun
RUN bun install

CMD node .
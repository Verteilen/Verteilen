FROM node:22.10-slim AS builder
WORKDIR /app/

COPY . .

RUN npm install -g bun
RUN bun install
RUN bun run build:node

FROM ubuntu:noble

RUN apt update
RUN apt -y install npm nodejs

WORKDIR /app/
EXPOSE 12080

COPY --from=builder /app/build/node /app/
RUN npm install -g bun
RUN bun install

CMD node .
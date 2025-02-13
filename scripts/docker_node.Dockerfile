FROM node:22.10-slim as builder
WORKDIR /app/

COPY . .

RUN npm install

FROM node:22.10-alpine
WORKDIR /app/
EXPOSE 12080

COPY --from=builder /app/ /app/

CMD node .
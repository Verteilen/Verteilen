FROM node:22.10-alpine

WORKDIR /app
COPY ./build/node .
RUN npm install

EXPOSE 12080

CMD node .
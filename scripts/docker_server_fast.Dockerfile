FROM node:22.10-alpine
WORKDIR /app/
COPY ./build/server .
RUN npm install

EXPOSE 11777
EXPOSE 11080

CMD node .
FROM ubuntu:noble

RUN apt update
RUN apt -y install npm nodejs

WORKDIR /app
COPY ./build/node .
RUN npm install

EXPOSE 12080

CMD node .
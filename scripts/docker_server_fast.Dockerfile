FROM ubuntu:noble

RUN apt update
RUN apt -y install npm nodejs

WORKDIR /app/
COPY ./build/server .
RUN npm install

EXPOSE 11777
EXPOSE 11080

CMD node .
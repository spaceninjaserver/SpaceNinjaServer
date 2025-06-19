FROM node:24-alpine3.21

RUN apk add --no-cache bash jq

COPY . /app
WORKDIR /app

RUN npm i --omit=dev
RUN npm run build

ENTRYPOINT ["/app/docker-entrypoint.sh"]

FROM node:24-alpine3.21

RUN apk add --no-cache bash jq

COPY . /app
WORKDIR /app

RUN npm i --omit=dev
RUN npm run build
RUN date '+%d %B %Y' > BUILD_DATE

ENTRYPOINT ["/app/docker-entrypoint.sh"]

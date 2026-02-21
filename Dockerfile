FROM node:24-alpine3.21
WORKDIR /app

RUN apk add --no-cache bash jq

COPY package.json package-lock.json /app
RUN npm i --omit=dev --omit=optional --no-audit

COPY . /app
RUN date '+%d %B %Y' > BUILD_DATE
ENTRYPOINT ["/app/docker-entrypoint.sh"]

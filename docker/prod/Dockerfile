FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY ../../package*.json ./

RUN npm install --production

COPY ../../src ./src
COPY ../../public ./public

FROM node:20-alpine AS prod

WORKDIR /usr/src/app

COPY --from=build /usr/src/app ./

EXPOSE 3000

CMD ["npm", "start"]

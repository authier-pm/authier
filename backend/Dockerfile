FROM node:16-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache git
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD https://www.google.com /time.now
COPY ./package.json /usr/src/app
COPY ./yarn.lock /usr/src/app
#COPY ./tsconfig.json /usr/src/app
COPY ./dist /usr/src/app/server
COPY prisma ./prisma/

RUN yarn


ENV NODE_ENV production
ENV DATABASE_URL "postgresql://authier:auth133r@postgresprisma:5432/authier?schema=public"
ENV PORT 80
EXPOSE 80
RUN printenv
CMD yarn caprover
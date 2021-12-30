FROM node:16-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache git
RUN mkdir -p /usr/src/app
# WORKDIR /usr/src/app

# ADD https://www.google.com /time.now
# COPY ./backend/package.json /usr/src/app
# COPY ./backend/yarn.lock /usr/src/app
# COPY ./backend/tsconfig.json /usr/src/app
# RUN yarn
# RUN yarn build

# COPY ./backend/dist /usr/src/app
# COPY ./backend/prisma ./prisma/

ENV NODE_ENV production
ENV DATABASE_URL "postgresql://authier:auth133r@localhost:6432/authier"
ENV PORT 80
EXPOSE 80
RUN printenv
#CMD yarn caprover
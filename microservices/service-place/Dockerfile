# This is the base image used: https://github.com/nodejs/docker-node/blob/9e9c0ecbd938e672add198b3cbbb2ab7704f6970/16/alpine3.15/Dockerfile

# build stage
FROM node:16-alpine3.15 AS buildStage
WORKDIR /build
COPY . .
RUN yarn && yarn compile

# runtime stage
FROM node:16-alpine3.15
WORKDIR /home
COPY --from=buildStage /build .

# install python for the web scraping. this could be moved into the build stage later for faster builds
RUN apk add chromium chromium-chromedriver python3
RUN python3 -m ensurepip
RUN pip3 install selenium bs4 platform

EXPOSE 8080
ENTRYPOINT ["node"]
CMD ["dist/src/server.js"]

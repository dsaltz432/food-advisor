# build stage
FROM node:16-buster AS buildStage
WORKDIR /build
COPY . .
RUN yarn && yarn compile

# runtime stage
FROM node:16-buster
WORKDIR /home
COPY --from=buildStage /build .

# install python for the web scraping. this could be moved into the build stage later for faster builds
RUN apt-get update && apt-get -y install chromium chromium-driver python3
RUN python3 -m ensurepip
RUN pip3 install selenium bs4

EXPOSE 8080
ENTRYPOINT ["node"]
CMD ["dist/src/server.js"]

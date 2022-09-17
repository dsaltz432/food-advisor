# build stage
FROM node:16-alpine3.16 AS buildStage
WORKDIR /build
COPY . .
RUN yarn && yarn compile

# runtime stage
FROM node:16-alpine3.16
WORKDIR /home
COPY --from=buildStage /build .

EXPOSE 8080
ENTRYPOINT ["node"]
CMD ["dist/src/server.js"]

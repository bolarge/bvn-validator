# syntax=docker/dockerfile:1.0.0-experimental

FROM 334236250727.dkr.ecr.us-west-2.amazonaws.com/carbon-golden-containers/node:v8

LABEL Carbon Developers <developers@getcarbon.co>

USER root

RUN apk add --no-cache openssh-client

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan -t rsa bitbucket.org >> ~/.ssh/known_hosts

# Add support for https on wget
RUN apk update && apk add --no-cache wget && apk --no-cache add openssl wget && apk add ca-certificates && update-ca-certificates

# Add phantomjs
RUN wget -qO- "https://github.com/dustinblackman/phantomized/releases/download/2.1.1a/dockerized-phantomjs.tar.gz" | tar xz -C / \
    && npm config set user 0 \
    && npm install -g phantomjs-prebuilt

# Add fonts required by phantomjs to render html correctly
RUN apk add --update ttf-dejavu ttf-droid ttf-freefont ttf-liberation ttf-ubuntu-font-family && rm -rf /var/cache/apk/*


RUN mkdir -p /bvn-validation-service && \
        mkdir -p /logs 
RUN cd /bvn-validation-service && rm -rf *

WORKDIR /bvn-validation-service

ADD package.json /bvn-validation-service/package.json
ADD package-lock.json /bvn-validation-service/package-lock.json

RUN --mount=type=ssh,id=bitbucket npm install --production && \
        npm install -g phantomjs-prebuilt

COPY . /bvn-validation-service

ENV PORT=3005

RUN chown -R appuser:appuser /logs && \
        chown -R appuser:appuser /bvn-validation-service

USER appuser

CMD pm2 start app.js -i 1 --no-daemon --name app -o /logs/out.log -e /logs/err.log

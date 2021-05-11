# syntax=docker/dockerfile:1.0.0-experimental
FROM 334236250727.dkr.ecr.us-west-2.amazonaws.com/carbon-golden-containers/node:v8

LABEL Carbon Developers <developers@getcarbon.co>

USER root

RUN apk add --no-cache openssh-client

RUN mkdir -p -m 0600 ~/.ssh && ssh-keyscan bitbucket.org >> ~/.ssh/known_hosts

# ADD docker-ssh /root/.ssh

# RUN ssh-keyscan -t rsa bitbucket.org >> /root/.ssh/known_hosts && \
#         chown root:$USER /root/.ssh/config && \
#         chmod 644 /root/.ssh/config && \
#         chmod 0600 /root/.ssh/bitbucket && \
#         ssh git@bitbucket.org

# Add support for https on wget
RUN apk update && apk add --no-cache wget && apk --no-cache add openssl wget && apk add ca-certificates && update-ca-certificates

# Add phantomjs
RUN wget -qO- "https://github.com/dustinblackman/phantomized/releases/download/2.1.1a/dockerized-phantomjs.tar.gz" | tar xz -C / \
    && npm config set user 0 \
    && npm install -g phantomjs-prebuilt

# Add fonts required by phantomjs to render html correctly
RUN apk add --update ttf-dejavu ttf-droid ttf-freefont ttf-liberation ttf-ubuntu-font-family && rm -rf /var/cache/apk/*


RUN mkdir -p /bvn-validation-service
RUN mkdir -p /logs
RUN cd /bvn-validation-service && rm -rf *

WORKDIR /bvn-validation-service

ADD package.json /bvn-validation-service/package.json
ADD package-lock.json /bvn-validation-service/package-lock.json
RUN --mount=type=ssh,id=bitbucket npm install --production && \
        npm install -g phantomjs-prebuilt

COPY . /bvn-validation-service

ENV PORT=3005

USER appuser

CMD pm2 start app.js -i 1 --no-daemon --name app -o /logs/out.log -e /logs/err.log

FROM 334236250727.dkr.ecr.us-west-2.amazonaws.com/carbon-golden-containers/node:v10

LABEL Carbon Developers <developers@getcarbon.co>

RUN apk add openssh

ADD docker-ssh /root/.ssh
RUN ssh-keyscan -t rsa bitbucket.org >> ~/.ssh/known_hosts && \
        chmod 0600 /root/.ssh/bitbucket && \
        ssh git@bitbucket.org

RUN mkdir -p /bvn-validation-service
RUN mkdir -p /logs 
RUN chown -R appuser:appuser /logs
RUN cd /bvn-validation-service && rm -rf *

WORKDIR /bvn-validation-service

ADD package.json /bvn-validation-service/package.json
ADD package-lock.json /bvn-validation-service/package-lock.json
RUN npm install --production

COPY . /bvn-validation-service
RUN chown -R appuser:appuser /bvn-validation-service

# ENV PORT=3005
# EXPOSE 3005
USER appuser

# CMD pm2 start app.js -i 1 --no-daemon --name app -o /logs/out.log -e /logs/err.log
CMD node app.js
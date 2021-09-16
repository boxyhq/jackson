FROM node:16.9.1-alpine3.14

ENV NODE_OPTIONS="--max-http-header-size=81920"

RUN mkdir /jackson
WORKDIR /jackson

COPY package.json /jackson
COPY package-lock.json /jackson

RUN cd /jackson
RUN npm ci --only=production

COPY LICENSE /jackson
COPY src/ /jackson/src/

EXPOSE 8000
EXPOSE 6000

CMD [ "node", "src/index.js" ]

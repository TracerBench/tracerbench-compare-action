FROM node:22

COPY node_modules /node_modules
COPY src /src
COPY action.yml /action.yml

ENTRYPOINT ["node", "./src/action.mjs"]
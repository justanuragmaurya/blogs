FROM node::22-alpine

WORKDIR /root

COPY ./package.json ./package.json

RUN npm install -g pnpm
RUN pnpm install

COPY . .

RUN pnpm build

CMD [ "pnpm" ,"dev"]
FROM node:lts-alpine

RUN mkdir -p /home/app
WORKDIR /home/app
COPY package.json .
RUN npm install
COPY tsconfig.json .
COPY src ./src
RUN npm run build

CMD ["node", "release/app.js"]
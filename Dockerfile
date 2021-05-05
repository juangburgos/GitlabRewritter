FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD [ "node", "grewritter.js" ]
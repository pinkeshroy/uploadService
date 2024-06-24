FROM node:20.0-alpine as service

WORKDIR /usr/src/app
COPY package.json ./
RUN npm install 
COPY . .

EXPOSE 3000
#CMD node "./src/index.js"
CMD ["npm", "start"]
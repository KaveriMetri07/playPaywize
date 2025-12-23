FROM node:18-bullseye

WORKDIR /app

COPY package*.json ./
RUN npm install 

COPY . .
RUN npx prisma generate

EXPOSE 5000
EXPOSE 5432


CMD ["npm", "start"]

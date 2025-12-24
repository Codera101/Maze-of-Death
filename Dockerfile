FROM node:20-alpine AS build  
WORKDIR /app
COPY package*.json ./

FROM build AS development
RUN npm install
COPY . .
EXPOSE 3000 3001
CMD ["npm", "run", "dev"]

FROM build AS production
RUN npm install --only=production
COPY . .
EXPOSE 3000 3001
CMD ["npm", "start"]
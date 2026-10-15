FROM node:24.11.0-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .

ENV PORT=4173
EXPOSE 4173
CMD ["npm", "start"]

FROM node:20.17.0-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["npm", "run", "dev"]

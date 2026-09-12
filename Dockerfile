FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
ENV HOST=0.0.0.0 PORT=3000 LIFE_MEMORY_DATA_DIR=/data
VOLUME ["/data"]
EXPOSE 3000
CMD ["npm", "run", "start:http"]

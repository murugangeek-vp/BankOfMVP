FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy application source
COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/index.js"]

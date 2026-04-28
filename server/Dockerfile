# Base image
FROM node:18

# Tạo thư mục app
WORKDIR /app

# Copy package.json trước để cache
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port backend
EXPOSE 5000

# Chạy server
CMD ["node", "index.js"]
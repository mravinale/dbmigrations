# Use a Node.js base image
FROM node:14-alpine

# Install necessary dependencies: mysql-client, postgresql-client, sqlite
RUN apk update && \
    apk add --no-cache mysql-client postgresql-client sqlite

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install project dependencies, including dbmate as a dev dependency
RUN npm install

# Copy the rest of the application code
COPY . .

# Make DATABASE_URL configurable through environment variables
ENV DATABASE_URL=""

# Expose necessary ports if needed
EXPOSE 5432 3306

# Default command to run dbmate migrations using npx
CMD ["sh", "-c", "npx dbmate up && npm run start"]



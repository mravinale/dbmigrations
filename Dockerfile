# Use a Node.js base image
FROM node:14-alpine

# Install necessary dependencies: mysql-client, postgresql-client, sqlite, git
RUN apk update && \
    apk add --no-cache mysql-client postgresql-client sqlite git

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install project dependencies, including dbmate as a dev dependency
RUN npm install

# Copy the rest of the application code
COPY . .

# Configure Git with a default name and email
RUN git config --global user.name "Migrations-Bot" && \
    git config --global user.email "Migrations@bot.com"

# Expose necessary ports if needed
EXPOSE 5432 3306

# Default command to run dbmate migrations and start the app
CMD ["sh", "-c", "npx dbmate up && npm run start"]

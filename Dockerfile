# Use a more recent Node.js version
FROM node:18-alpine

# Set the working directory in the Docker container
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@10.7.0

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --omit=dev

# Add node_modules/.bin to PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy the rest of your application code
COPY . .

# Build the application
RUN npm run build

# Expose the port your app runs on
EXPOSE 3001

# Command to run your app
CMD ["node", "dist/app.js"]

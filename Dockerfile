# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY web/package*.json .

# Install the application dependencies
RUN npm i
RUN npm i pnpm

# Copy the rest of the application code to the working directory
COPY web/ .

# Build the Next.js application
RUN npm run build:self-host

# Expose the port on which the application will run
#EXPOSE 3000

# Set the command to run the application
CMD ["npm", "start"]

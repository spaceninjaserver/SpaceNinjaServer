# Image: https://hub.docker.com/_/node
FROM node:21-bullseye

# Default location in container for VS Code to mount files into
WORKDIR /workspace

# Copies everything from the root of the repository into the image
COPY . .

# Updates the package index and installs git
RUN apt-get update \
    && apt-get -y install git \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# We need to install the following packages to be able to install MongoDB
RUN apt-get install gnupg curl

# Adds the MongoDB public key to the system
RUN curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor

# Creates the /etc/apt/sources.list.d/mongodb-org-7.0.list file for MongoDB
RUN echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Reload local package database
RUN apt-get update

# Installs the MongoDB
RUN apt-get install -y mongodb-org

# Installs pnpm
RUN npm install -g pnpm

# Install MongoDB from the official repository
RUN apt-get install -y mongodb-org

# Creates the MongoDB data directory
RUN mkdir -p /data/db

# Installs dependencies
RUN pnpm install

# Expose MongoDB port
EXPOSE 27017

# Expose required ports
EXPOSE 3000

# Run MongoDB
CMD mongod --fork --logpath /var/log/mongodb.log

# When the container starts, run the launch script
ENTRYPOINT [ "pnpm", "run", "dev" ]
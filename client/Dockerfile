FROM node:20.18.0

# Set working directory for frontend
WORKDIR /client

# Copy the Next.js app files
COPY ./package*.json .

# Install Node.js dependencies
RUN npm install

# Copy the rest of the Next.js app
COPY . .

# TEMPORARY:
# Set environment variable to skip ESLint during build
ENV NEXT_IGNORE_ESLINT=true
ENV TSC_COMPILE_ON_ERROR=true
ENV ESLINT_NO_DEV_ERRORS=true

# Build the frontend
RUN npm run build

# Expose the port Next.js will run on
EXPOSE 3000

# Command to run the Next.js app
CMD ["npm", "run", "start"]

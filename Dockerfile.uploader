FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Initialize minimum package.json mapping Express & Multer dependencies
RUN npm init -y && \
    npm pkg set type="module" && \
    npm install express multer cors

# Copy the backend code into the container
COPY backend-uploader.js .

# Create the directory that the K8s PVC will be mounted to
RUN mkdir -p /data/uploads

# Expose the API port
ENV PORT=3000
ENV UPLOAD_DIR=/data/uploads

EXPOSE 3000

# Start the uploader API
CMD ["node", "backend-uploader.js"]

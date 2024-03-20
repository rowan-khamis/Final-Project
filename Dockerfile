FROM node:20.9.0

# work  directory
WORKDIR /src/app


# install dependencies
COPY package*.json ./

# Build the app
RUN npm install


# copy all files
COPY . .

# Run the app
CMD [ "npm" ,"start" ]


#set environment variable
ENV PORT=3000
ENV CONNECTION_URL_LOCAL=mongodb://localhost:27017/ecommerce-dev
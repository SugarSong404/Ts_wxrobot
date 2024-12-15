FROM node:slim
WORKDIR /
COPY . /
RUN npm config set registry https://registry.npmmirror.com
RUN npm install --dependencies
EXPOSE 8082
CMD ["node", "index.js"]
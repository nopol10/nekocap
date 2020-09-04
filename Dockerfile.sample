FROM node:14.15.1-alpine3.12 as build

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

RUN npm ci

COPY . ./
RUN npm run build:web

FROM nginx:stable-alpine
COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
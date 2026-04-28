FROM nginx:alpine
COPY . /usr/share/nginx/html
# Cloud Run expects the container to listen on port 8080 by default.
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
EXPOSE 8080

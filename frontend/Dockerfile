FROM nginx:alpine AS runtime
RUN addgroup -g 1001 nginx && adduser -S nginx -u 1001 -G nginx
COPY --chown=nginx:nginx index.html /usr/share/nginx/html/
USER nginx
EXPOSE 80

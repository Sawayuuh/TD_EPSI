FROM alpine:3 AS builder
WORKDIR /build
COPY index.html ./

FROM nginx:alpine
COPY --from=builder /build/index.html /usr/share/nginx/html/index.html
EXPOSE 80
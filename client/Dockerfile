# ========================
# Build Stage
# ========================
FROM node:22-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build-stage

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ========================
# Production Stage
# ========================
FROM httpd:2.4.62-alpine@sha256:88c55a4fcc1df6cf9e7b38360fb6a6feb4d5c5cf5a27a9ff38096ae585af707f AS production-stage

# Copy built files to Apache's public folder
COPY --from=build-stage /app/dist/ /usr/local/apache2/htdocs/

# Copy reverse-proxy and security-header configuration
COPY ./httpd.conf /usr/local/apache2/conf/extra/baitulmal.conf

# Copy .htaccess if exists
COPY ./config/.htaccess /usr/local/apache2/htdocs/.htaccess

# Enable rewrite, reverse proxy, and header modules
RUN sed -i '/<Directory "\/usr\/local\/apache2\/htdocs">/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /usr/local/apache2/conf/httpd.conf \
 && sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/' /usr/local/apache2/conf/httpd.conf \
 && sed -i 's/#LoadModule proxy_module/LoadModule proxy_module/' /usr/local/apache2/conf/httpd.conf \
 && sed -i 's/#LoadModule proxy_http_module/LoadModule proxy_http_module/' /usr/local/apache2/conf/httpd.conf \
 && sed -i 's/#LoadModule headers_module/LoadModule headers_module/' /usr/local/apache2/conf/httpd.conf \
 && sed -i '$a Include conf/extra/baitulmal.conf' /usr/local/apache2/conf/httpd.conf

# Expose port
EXPOSE 80

# Start Apache in foreground
CMD ["httpd-foreground"]

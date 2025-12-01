# =====================
# Stage 1: Build Angular
# =====================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Build de producción usando npx para Angular CLI
RUN npx ng build --configuration production

# =====================
# Stage 2: Serve con Nginx
# =====================
FROM nginx:alpine

# Copiar los archivos compilados de Angular a Nginx
COPY --from=build /app/dist/aquavision-front/browser /usr/share/nginx/html

# Copiar configuración SPA-ready
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

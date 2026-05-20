# Etapa 1: Compilación
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration=production

# Etapa 2: Servidor de producción
FROM nginx:alpine
# Copiamos los archivos compilados al directorio de Nginx
# OJO: Asegúrate de que el nombre de la carpeta coincida con tu dist (ej. dist/microplastics-detector/browser)
COPY --from=build /app/dist/microplastics-detector/browser /usr/share/nginx/html

# Copiamos una configuración personalizada de Nginx para evitar el error 404 del router
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# QR.Gen

Aplicación web para crear códigos QR personalizados y tarjetas de visita digitales, sin necesidad de registrarse ni instalar nada.

**[Probar QR.Gen](https://qrgent.vercel.app/)**

## Funcionalidades

### Generador de códigos QR

- Generación de códigos QR a partir de cualquier URL.
- Personalización de la forma de los módulos: cuadrados o círculos.
- Selección de colores para el código y el fondo.
- Posibilidad de añadir una imagen o logotipo en el centro.
- Editor de imagen integrado para ajustar el encuadre y el zoom.
- Descarga del código QR en formato PNG.

### Tarjetas personales digitales

- Creación de tarjetas de visita digitales personalizadas.
- Campos para nombre, apellidos, profesión y descripción.
- Información de contacto: correo electrónico y teléfono.
- Enlaces a portfolio, LinkedIn, Instagram y X.
- Personalización de colores y fotografía.
- Generación de un código QR para compartir la tarjeta.
- Acceso a la tarjeta mediante un enlace compartible.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- [QRCode](https://www.npmjs.com/package/qrcode): generación de códigos QR.
- [esbuild](https://esbuild.github.io/): empaquetado y optimización del proyecto.
- Vercel: despliegue y hosting.

## Instalación y ejecución

Requisitos: Node.js 18 o superior.

Clona el repositorio:

```bash
git clone https://github.com/enol-mf/QR.Gen.git
cd QR.Gen
```

Instala las dependencias:
```bash
npm install
```

Inicia el servidor de desarrollo:
```bash
npm run dev
```

Abre en el navegador la dirección:
```bash
http://127.0.0.1:8000
```

Para generar la versión de producción:
```bash
npm run build
```

Los archivos optimizados se generan en el directorio dist/.
Estructura del proyecto
```bash
QR.Gen/
├── index.html
├── style.css
├── script.js
├── card.js
├── icon.png
├── package.json
├── package-lock.json
├── vercel.json
└── README.md
```

Privacidad
La generación de códigos QR y el procesamiento de las tarjetas se realizan en el navegador, sin necesidad de un backend.

Los datos de las tarjetas se codifican en el fragmento de la URL para permitir compartirlas mediante un enlace.

Ten en cuenta que cualquier persona que tenga el enlace de una tarjeta puede acceder a la información incluida en ella.
Despliegue
El proyecto está preparado para desplegarse en Vercel mediante la configuración incluida en vercel.json.

Desarrollado por Enol Marqués.

# QR.Gen

Generador de códigos QR a partir de una URL. Todo el procesamiento ocurre en el navegador: las URLs no se envían a ningún servidor ni se almacenan.

## Requisitos

Node.js 18 o superior.

## Comandos

```bash
npm install
npm run dev    # servidor local en http://127.0.0.1:8000
npm run build  # genera la web estática en dist/
```

Importante: el `index.html` de la raíz es el código fuente y **no funciona si se abre directamente** en el navegador, porque `script.js` importa la librería `qrcode` y necesita estar empaquetada. Para probarlo en local, o bien `npm run dev` y abrir http://127.0.0.1:8000, o bien `npm run build` y abrir `dist/index.html`.

## Estructura

```text
/
├── index.html
├── style.css
├── script.js
├── package.json
└── vercel.json
```

`script.js` usa la librería [qrcode](https://github.com/soldair/node-qrcode). El build con esbuild empaqueta esa dependencia en `dist/` para que no haga falta ningún backend.

## Despliegue en Vercel

`vercel.json` ya define `npm run build` como comando de build y `dist` como directorio de salida. Solo hay que importar el repositorio en Vercel.

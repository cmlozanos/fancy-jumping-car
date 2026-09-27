# Imágenes del reto de lectura

## Atribución y licencia

Los símbolos pictográficos utilizados son propiedad del Gobierno de Aragón y han sido creados por **Sergio Palao** para [ARASAAC](https://arasaac.org), que los distribuye bajo [Creative Commons Reconocimiento-NoComercial-CompartirIgual 4.0 Internacional (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es).

Se conservan los PNG originales reducidos que ofrece ARASAAC: no se ha recortado, repintado ni eliminado información. Los pictogramas y cualquier material educativo derivado de ellos deben conservar atribución, uso no comercial y la misma licencia. Esta incorporación no relicencia el código o los recursos independientes de otros autores.

Condiciones oficiales consultadas el **27 de septiembre de 2026**: [ARASAAC — Terms of use](https://arasaac.org/terms-of-use). La página enlaza expresamente CC BY-NC-SA **4.0**, identifica autor y propietario y excluye usos comerciales. El usuario confirmó estas condiciones, el banco de palabras y su publicación antes de descargar los recursos.

## Procedencia y comprobaciones

- [READING_WORDS.md](READING_WORDS.md) relaciona las 100 palabras con sus fichas individuales de ARASAAC y búsquedas originales de referencia.
- [reading-images/manifest.json](reading-images/manifest.json) guarda por imagen el ID, URL original, dimensiones, bytes y SHA-256.
- Origen: `https://static.arasaac.org/pictograms/{id}/{id}_300.png`; copia local `reading-images/{id}.png`.
- Los 100 metadatos de `https://api.arasaac.org/api/pictograms/es/{id}` coinciden con el ID y la palabra; indicadores `sex` y `violence` en falso.
- **100 PNG**, de **298 o 299 px**, **935825 bytes en total**; la mayor imagen ocupa **19090 bytes**. Se usan los archivos ya comprimidos del proveedor, sin pérdida adicional ni dependencias de imágenes en producción.
- Las 100 imágenes se decodificaron y revisaron visualmente en cuatro láminas de 25. No fue necesario sustituir ningún dibujo. Las incompatibilidades de distractores detectadas se declaran en `reading-words.js`.

## Herramientas reproducibles

Desde la raíz de Home, con Node.js 20 o posterior:

```sh
node learning-gate/tools/reading-assets.cjs
```

Esta comprobación es local: valida el banco de 100 palabras minúsculas de hasta cinco letras, IDs únicos, grupos, firmas PNG, dimensiones, tamaño y correspondencia exacta con el manifiesto SHA-256.

Para obtener de nuevo los recursos aprobados:

```sh
node learning-gate/tools/reading-assets.cjs --download
```

Solo este modo accede a la red. Limita la concurrencia a dos peticiones y consulta exclusivamente los 100 IDs aprobados; emite el manifiesto para revisión. Crea PNG ausentes, conserva los existentes si son idénticos y falla si el proveedor ofrece bytes distintos. No sobrescribe imágenes divergentes ni actualiza automáticamente el manifiesto. No consulta cuentas, credenciales ni datos de niños.

Para reconstruir las láminas de revisión, utilizando Playwright ya declarado como dependencia de desarrollo del proyecto:

```sh
node learning-gate/tools/reading-contact-sheet.cjs /tmp/reading-assets-review
```

Genera cuatro PNG en la carpeta indicada, decodificando las imágenes locales sin solicitudes a la red. Las láminas son artefactos de revisión; no se cargan en los juegos.

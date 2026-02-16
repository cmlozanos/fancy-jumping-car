# Plan del proyecto

## Investigacion (resumen)
Fuentes consultadas:
- https://www.anaitgames.com/analisis/analisis-what-the-car
- https://portal.33bits.net/analisis-what-the-car/
- https://niveloculto.com/analisis-what-the-car/

Hallazgos clave:
- El objetivo base es simple: llevar el vehiculo del punto A al punto B, casi siempre en niveles cortos.
- La gracia principal esta en variaciones absurdas del coche y controles que cambian cada nivel.
- Hay muchos niveles, con temas por mundos, humor blanco y sorpresas constantes.
- Se incentiva rejugar con objetivos de tiempo (medallas) y coleccionables escondidos.
- Controles en movil pueden sentirse imprecisos; el juego busca ser accesible y rapido de entender.

## Que vamos a hacer (version propia, objetivo replicado)
- Un juego de navegador en JavaScript, mobile-first, con niveles cortos y absurdos.
- Objetivo: completar cada nivel llevando el vehiculo a la meta, con 1 gimmick principal por nivel.
- Variacion constante de mecanicas (patas, jetpack, muelles, giro en tanque, etc.) pero con reglas simples.
- Sistema de medallas por tiempo (bronce/plata/oro) y un coleccionable por nivel.

## Alcance MVP
- 10-15 niveles cortos, agrupados en 3 mini mundos tematicos.
- 1 hub simple para seleccionar niveles.
- 6-8 tipos de variaciones de vehiculo (gimmicks reutilizables con ajustes de nivel).
- Metricas basicas: tiempo, medalla, coleccionable.
- UI clara para movil: botones grandes y feedback visual.

## Game loop
1) Seleccionar nivel en el hub.
2) Leer el cartel del gimmick (texto corto y humor simple).
3) Completar la carrera/mini desafio.
4) Mostrar tiempo, medalla y coleccionable.
5) Volver al hub con progreso.

## Controles mobile-first
- Doble boton tactil (izquierda/derecha) + boton de accion cuando aplique.
- Alternativas por nivel: controles tipo tanque o boton unico de impulso.
- Soporte opcional para teclado en escritorio.

## Direccion de arte y tono
- Estetica simple y colorida, con formas redondeadas y humor visual.
- Animaciones exageradas y sonidos comicos.
- Mensajes cortos por nivel con chistes simples.

## Tecnologia y estructura
- HTML/CSS/JS sin frameworks para empezar.
- Canvas 2D para render y colisiones basicas.
- Motor fisico simple propio (o Matter.js si se decide despues).
- Escalado responsive con enfoque mobile-first.

## Criterios de exito
- Se entiende en 5-10 segundos sin tutorial largo.
- Cada nivel introduce una idea nueva o un giro claro.
- Rejugabilidad por medallas y coleccionables.
- Jugable y comodo en pantallas tactiles.

## Proximos pasos
- Validar con el usuario los gimmicks iniciales y el set de mundos.
- Definir la estructura de archivos y comenzar el prototipo del primer nivel.

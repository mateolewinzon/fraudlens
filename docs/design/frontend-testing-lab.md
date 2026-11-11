# Laboratorio de pruebas

La página de inicio (`/`) es un laboratorio para probar la API real: `POST` y `GET /api/transaction-evaluations`. Cada envío llama al proveedor de IA y se guarda en MongoDB. **Vista previa** (`/?modo=demo`) muestra funciones próximas con datos ilustrativos y no llama a la API.

## Laboratorio

- **Escenarios de prueba** (`src/lib/client/scenarios.ts`): completan el formulario con un click. Son datos de entrada, no reglas: la decisión siempre la toma el servidor y ningún escenario promete un resultado.
  - *Cliente nuevo* crea un usuario distinto en cada envío (sin historial).
  - *Compra habitual*, *Tarjeta extranjera* y *Monto fuera de patrón* usan el mismo usuario (`demo-cliente-frecuente`), así que enviar *Compra habitual* varias veces le construye historial aprobado.
- **ID de transacción y fecha** se completan al enviar si quedan vacíos (ID aleatorio y hora actual). Así el render inicial es igual en servidor y cliente, y "enviar de nuevo" crea otra transacción.
- **Resultado**: decisión en español con su color, `risk_score` de 0 a 1, motivos, señales traducidas y, desplegable, los datos de la operación, el historial usado (`history_count`), el modelo y la versión de evaluación.
- **Historial**: tabla paginada; cada fila abre su detalle en el mismo panel del resultado (parte de CU-06 con datos que la API ya devuelve).
- **Errores**: los mensajes de la API (en inglés) se reemplazan por mensajes en español. Un `400` con `fields` marca cada campo con su indicación.

### Límites

- El puntaje se muestra como número. **No se derivan niveles de riesgo** (alto, medio, bajo) porque no hay umbrales definidos.
- Los registros históricos `BLOCK` se muestran como "Bloqueada (registro anterior)", sin reinterpretarlos.
- `/api/health` solo indica que la app está levantada: no verifica MongoDB ni la IA, por eso la interfaz no muestra un indicador de estado basado en él.

## Vista previa

- Todo vive en el estado del navegador (`src/lib/demo/`); nada llama a la API ni se guarda.
- Usa la **configuración de ejemplo del documento de requerimientos**: monto mínimo ARS 10.000 (CU-02), revisar desde 60 y bloquear desde 85 (CU-04), niveles Bajo/Medio/Alto/Crítico (§6). El puntaje va de 0 a 100 como pide CU-03; la API real hoy devuelve 0 a 1.
- Cada pestaña indica su caso de uso y su estado: MVP, MVP simplificado o futuro fuera del MVP.
- **Monitor (CU-05)**: transacciones ilustrativas que se suman solas cada 7 segundos (se puede pausar), orden por fecha o puntaje, niveles y decisiones diferenciados, y transacciones aprobadas por la regla de monto mínimo sin ejecutar el modelo.

## Diseño responsivo

Cortes elegidos por contenido, verificados en 1366×657 (pantalla de 768 px de alto con el navegador abierto), 768 px y 390 px de ancho, sin desborde horizontal:

- ≥ 1280 px: barra lateral completa. 761–1279 px: barra de íconos. ≤ 760 px: barra superior.
- < 960 px: el formulario y los resultados se apilan en una columna.
- El historial usa *container queries*: oculta fecha y comercio cuando el panel se angosta y, por debajo de 480 px, cada fila pasa a tarjeta.
- El botón **Evaluar transacción** queda fijo al borde inferior de la pantalla mientras el formulario está visible.
- Tema claro por defecto y oscuro según el sistema. Fuentes cargadas con `next/font`.

## Pruebas

`tests/frontend-client.test.mjs` y `tests/frontend-presentation.test.mjs` usan `fetch` simulado: no hacen POST real, no consultan MongoDB ni llaman al proveedor de IA.

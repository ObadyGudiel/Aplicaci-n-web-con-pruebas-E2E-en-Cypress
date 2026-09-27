# Mi Café — pedidos con Cypress

Aplicación de ejemplo para pedir productos de una cafetería. Incluye interfaz web, API Express, persistencia local y recorridos E2E automatizados con Cypress y TypeScript.

## Arquitectura

- **Frontend:** HTML, CSS y JavaScript sin dependencias; usa roles accesibles y atributos `data-cy` solo en elementos críticos.
- **API:** Express sirve `GET /api/products` y `POST /api/orders`.
- **Persistencia:** `data/store.json` se crea automáticamente y guarda productos, stock y órdenes. Es intencionalmente local para que no haya servicios ni secretos externos.
- **Pruebas:** Cypress usa `baseUrl` (`http://127.0.0.1:3000`) y restablece datos antes de cada prueba mediante `POST /api/test/reset`.

## Requisitos y comandos

Requiere Node.js 24 o posterior.

```bash
npm install
npm start
```

Abre `http://127.0.0.1:3000`. Para ejecutar todas las comprobaciones:

```bash
npm test
```

Para abrir Cypress de forma interactiva:

```bash
npx cypress open
```

## Recorridos E2E

| Archivo | Recorrido |
| --- | --- |
| `cypress/e2e/checkout.cy.ts` | Agrega un Latte, confirma la orden y verifica el ID y total devueltos por la API real. Incluye `cy.intercept()` con el alias `createOrder`. |
| `cypress/e2e/validation.cy.ts` | Intenta confirmar un carrito vacío y comprueba que no se envíe `POST /api/orders`. |
| `cypress/e2e/stock-error.cy.ts` | Intercepta el envío y devuelve un `409` simulado para comprobar el mensaje de stock y la recuperación de la interfaz. |

Las pruebas no utilizan esperas numéricas. Cada prueba vuelve a los datos semilla con la API de prueba, por lo que puede ejecutarse de forma aislada y en cualquier orden. El endpoint de reinicio no usa ni modifica datos externos.

## CI y evidencia

El workflow [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) instala dependencias y ejecuta `npm test` en cada `push` y `pull request`. Si algo falla, conserva automáticamente las capturas y los videos generados por Cypress como artefacto.

Antes de entregar, reemplace los siguientes marcadores con los enlaces reales:

- Repositorio público: `REEMPLAZAR_CON_ENLACE_DEL_REPOSITORIO`
- Ejecución exitosa de GitHub Actions: `REEMPLAZAR_CON_ENLACE_DE_ACTIONS`
- Video demostrativo (máximo 3 minutos): `REEMPLAZAR_CON_ENLACE_DEL_VIDEO`

## Cypress, Playwright y Agent Browser

Elegí **Cypress** porque el reto exige su uso y porque sus alias e interceptaciones simplifican la verificación de solicitudes y fallos controlados en una aplicación local. Elegiría **Playwright** cuando necesitara automatización multibrowser más amplia, varias pestañas o una ejecución muy paralela. Usaría **Agent Browser** para recorridos exploratorios guiados por lenguaje natural, validación visual o descubrimiento de flujos; para estas pruebas de regresión deterministas, Cypress ofrece resultados más explícitos y repetibles.

## Uso de IA

Se utilizó Codex como asistencia para proponer una estructura inicial, selectores estables y casos de prueba. Las pruebas fueron revisadas para que sus aserciones validen comportamiento visible y respuestas reales o fallos explícitamente simulados; no se usaron credenciales ni datos sensibles.

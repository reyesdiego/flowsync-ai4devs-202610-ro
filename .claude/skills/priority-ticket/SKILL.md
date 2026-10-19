---
name: priority-ticket
description: Trae de Jira el ticket de mayor prioridad asignado al usuario en «Por hacer», resume sus criterios de aceptación, entra en plan mode para proponer la implementación y, al aprobarse el plan, mueve el ticket a «En curso».
disable-model-invocation: true
---

# /priority-ticket

Usa el servidor MCP `atlassian` (`.mcp.json`). Si sus herramientas no están disponibles o piden autenticación, para y dile al usuario que ejecute `/mcp` y se autentique en `atlassian`.

## 1. Encuentra el ticket

1. Obtén el `cloudId` con `getAccessibleAtlassianResources`. Si hay más de un sitio, pregunta cuál usar.
2. Busca con `searchJiraIssuesUsingJql`:

   ```
   assignee = currentUser() AND status = "Por hacer" ORDER BY priority DESC, created ASC
   ```

   Si el estado no existe con ese nombre (tablero en inglés u otro flujo), repite con `statusCategory = "To Do"` en su lugar.
3. Quédate con el primer resultado. Si no hay ninguno, dilo y termina.
4. Lee el ticket completo con `getJiraIssue`.

## 2. Resume

Muestra al usuario, breve:

- Clave, título y prioridad.
- Los criterios de aceptación tal como vienen, en lista.
- Lo que el ticket **no** especifica y habrá que sacar del código (p. ej. campos que exige un validador del backend). Compruébalo leyendo el código, no lo supongas.

## 3. Planifica

Entra en plan mode (`EnterPlanMode`). Explora el código necesario siguiendo `CLAUDE.md` y propón un plan que:

- Recorra cada criterio de aceptación y diga cómo se cumple.
- Liste los archivos que se crean o modifican.
- Explicite las decisiones que el ticket deja abiertas y cómo las resuelves.
- Diga cómo se verifica (lint, build, prueba manual contra el backend).

Presenta el plan con `ExitPlanMode`. No toques código antes de la aprobación.

## 4. Al aprobarse el plan

1. Obtén las transiciones con `getTransitionsForJiraIssue` y aplica la que lleve a «En curso» (o `In Progress`) con `transitionJiraIssue`. Si no existe, avisa y no inventes otra.
2. Confirma en una línea: clave del ticket y nuevo estado.

Si el usuario rechaza el plan, el ticket se queda en «Por hacer».

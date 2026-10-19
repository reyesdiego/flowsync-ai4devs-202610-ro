---
name: commit
description: Crea un commit convencional (tipo(scope): descripción) a partir de los cambios preparados (staged).
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
---

# /commit

Solo se commitea lo que ya está preparado. No ejecutes `git add` ni `git reset`, y no toques archivos.

## 1. Mira qué hay preparado

- `git diff --cached --stat` y `git diff --cached`.
- Si no hay nada preparado, dilo (enseña `git status --short`) y termina sin commitear.
- `git log --oneline -10` para seguir el estilo del repo.

## 2. Redacta el mensaje

Formato [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(scope): descripción

Cuerpo opcional: el porqué, no el qué.
```

- **tipo**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `build` o `ci`. Si los cambios mezclan tipos, elige el dominante; si son claramente independientes, sugiere separarlos en varios commits y para.
- **scope**: la parte afectada, en minúsculas: `frontend`, `backend`, `auth`, `harness`… Omítelo si no aporta.
- **descripción**: en español, en minúscula, en presente («añade», «corrige»), sin punto final y en 72 caracteres como máximo.
- **cuerpo**: solo si el porqué no es obvio a partir del diff. Si el cambio cierra un ticket de Jira, añade su clave (p. ej. `Refs: FS-12`).
- Acaba el mensaje con la línea de atribución:

  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```

## 3. Commitea

Usa un heredoc para conservar los saltos de línea:

```bash
git commit -F - <<'EOF'
tipo(scope): descripción

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
EOF
```

Si falla un hook de pre-commit, muestra el error y para: no uses `--no-verify` ni `--amend`.

Al terminar, muestra el `git log --oneline -1` resultante.

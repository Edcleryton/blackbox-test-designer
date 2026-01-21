## 1.Architecture design
```mermaid
graph TD
  A["User Browser"] --> B["React Frontend Application"]
  B --> C["Technique Engines (Client-side)"]
  B --> D["Local Storage (Draft/Session)"]
  B --> E["File Export (CSV/JSON via Blob)"]

  subgraph "Frontend Layer"
    B
    C
  end

  subgraph "Browser Services"
    D
    E
  end
```

## 2.Technology Description
- Frontend: React@18 + TypeScript + vite
- UI: tailwindcss@3
- Routing: react-router-dom@6 (1 rota principal)
- Form/validation (recomendado): react-hook-form + zod (validação do passo 1–3 antes de gerar)
- Backend: None

## 3.Route definitions
| Route | Purpose |
|---|---|
| / | Assistente em 4 passos: entrada → técnicas → configuração → revisão/deduplicação/exportação |

## 6.Data model(if applicable)
Não aplicável (sem banco). Persistência opcional apenas de rascunho/sessão via Local Storage.

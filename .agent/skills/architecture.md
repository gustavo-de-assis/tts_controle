# Component Architecture & Project Structure

Sempre siga a estrutura e os padrões do repositório de referência:

1. **Organização de Pastas (`src/`):**
   - `src/app/`: Apenas rotas, layouts e Server Components de página.
   - `src/components/ui/`: Componentes visuais genéricos e reutilizáveis (botões, modais, inputs).
   - `src/components/features/`: Componentes com lógica de negócio específica (ex: `product-form`, `stock-table`).
   - `src/services/` ou `src/actions/`: Chamadas de API, Server Actions e comunicação com banco.
   - `src/types/`: Interfaces e DTOs do TypeScript.

2. **Padrão de Componentes:**
   - Separar a camada de UI da lógica de apresentação/hooks quando o componente for complexo.
   - Usar exportações nomeadas (`export function ComponentName`).

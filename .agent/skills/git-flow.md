# Git Flow & Branching Strategy

Sempre siga estritamente estas regras para gerenciamento de código e branches:

1. **Proteção de Branches Principais:**
   - NUNCA faça commits diretos nas branches `main`, `master` ou `develop`.
   - A branch `main` representa o código em produção.
   - A branch `develop` representa o código integrado em desenvolvimento.

2. **Nomenclatura de Branches:**
   - **Features:** `feature/nome-da-funcionalidade` (ex: `feature/cadastrar-sku-produto`)
   - **Bugfixes:** `bugfix/descricao-do-bug` (ex: `bugfix/correcao-calculo-margem`)
   - **Hotfixes:** `hotfix/descricao-da-urgencia` (ex: `hotfix/bloqueio-estoque-negativo`)

3. **Fluxo de Trabalho:**
   - Antes de iniciar qualquer código, verifique em qual branch você está.
   - Crie a branch a partir de `develop` (para features e bugfixes) ou `main` (para hotfixes).
   - Ao concluir a tarefa, certifique-se de realizar commits pequenos e semânticos (ex: `feat: add SKU validation schema`, `fix: prevent negative stock on checkout`).

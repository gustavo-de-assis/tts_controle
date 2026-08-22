# Test-Driven Development (TDD) Guidelines

Ao implementar novas funcionalidades ou regras de negócio, aplique rigorosamente o ciclo Red-Green-Refactor:

1. **RED (Escreva o teste primeiro):**
   - Antes de escrever qualquer código da funcionalidade, crie o arquivo de teste correspondente (`*.test.ts` ou `*.spec.ts`).
   - Defina as asserções com base nas Regras de Negócio especificadas (ex: RN-002: não permitir estoque negativo).
   - Execute o teste e garanta que ele **FALHE** (confirmando que a funcionalidade ainda não existe).

2. **GREEN (Código mínimo para passar):**
   - Escreva apenas a quantidade mínima de código necessária no arquivo principal para fazer o teste passar.
   - Não adicione abstrações desnecessárias ou otimizações precoces nesta etapa.
   - Execute o teste e garanta que ele **PASSE**.

3. **REFACTOR (Melhore a estrutura):**
   - Limpe e organize o código (remova duplicações, melhore nomes de variáveis, aplique boas práticas de clean code).
   - Garanta que todos os testes continuem **PASSANDO** após a refatoração.

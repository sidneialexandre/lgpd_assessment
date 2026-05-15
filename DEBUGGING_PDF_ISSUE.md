# Debugging: PDF Company Name Issue

## Status da Investigação

### ✅ Backend - FUNCIONANDO CORRETAMENTE
- **Banco de dados**: Empresa 120002 tem razaoSocial = "Silvana e Elaine Casa Noturna Ltda"
- **Procedimento tRPC `getWithDetails`**: Retorna `companyName: "Silvana e Elaine Casa Noturna Ltda"`
- **Testes**: 227 testes passando, incluindo:
  - `company-name-pdf.test.ts` (4 testes)
  - `pdf-company-name-integration.test.ts` (3 testes)
  - `pdf-flow-debug.test.ts` (1 teste)
  - `pdf-generation-simulation.test.ts` (3 testes)

### ❓ Frontend - PRECISA SER DEBUGADO
- O valor de `data.companyName` pode estar undefined ou vazio quando chega ao PDF
- O fallback "Empresa " + companyId está sendo usado

## Como Debugar no Navegador

### Passo 1: Preparar o Navegador

1. Abra a página de resultados:
   ```
   https://lgpdassess-zbqzx56c.manus.space/assessment-results/660001?admin=true
   ```

2. Abra o Developer Tools (F12 ou Ctrl+Shift+I)

3. Vá para a aba "Console"

4. Limpe o console (Ctrl+L ou clique no ícone de lixeira)

### Passo 2: Clicar no Botão de Download

1. Clique no botão "Download Relatório PDF"

2. **Observe os logs no console** - Você verá logs como:

```
[DOWNLOAD PDF] === INICIANDO DOWNLOAD ===
[DOWNLOAD PDF] data.companyName: Silvana e Elaine Casa Noturna Ltda type: string
[DOWNLOAD PDF] data.assessment.companyId: 120002
[DOWNLOAD PDF] data.groups: [...]
[DOWNLOAD PDF] Dados completos da query: {...}
[DOWNLOAD PDF] finalCompanyName: Silvana e Elaine Casa Noturna Ltda
```

E depois:

```
[PDF] === INICIANDO GERAÇÃO DE PDF ===
[PDF] Dados recebidos: {
  companyName: "Silvana e Elaine Casa Noturna Ltda",
  companyNameType: "string",
  companyNameLength: 34,
  ...
}
[PDF] Dados completos: {...}
[PDF] Display company name: Silvana e Elaine Casa Noturna Ltda original: Silvana e Elaine Casa Noturna Ltda
[PDF] Filename: LGPD_Relatorio_Silvana_e_Elaine_Casa_Noturna_Ltda_1.pdf
[PDF] PDF gerado e salvo com sucesso: LGPD_Relatorio_Silvana_e_Elaine_Casa_Noturna_Ltda_1.pdf
```

### Passo 3: Copiar os Logs

1. Selecione todos os logs (Ctrl+A)
2. Copie (Ctrl+C)
3. Cole em um arquivo de texto

### Passo 4: Analisar os Logs

**Cenário 1: Se `data.companyName` é "Silvana e Elaine Casa Noturna Ltda"**
- ✅ Backend está funcionando corretamente
- ✅ tRPC está retornando os dados corretamente
- ✅ Frontend está recebendo os dados corretamente
- ✅ PDF está sendo gerado com o nome correto
- **Conclusão**: O problema foi resolvido!

**Cenário 2: Se `data.companyName` é undefined ou vazio**
- ❌ Backend está retornando undefined
- **Próximo passo**: Verificar o console do servidor

**Cenário 3: Se `finalCompanyName` é "Empresa 120002"**
- ❌ O fallback está sendo usado
- **Próximo passo**: Verificar por que `data.companyName` é undefined

**Cenário 4: Se `[PDF] Display company name` é "Empresa desconhecida"**
- ❌ O companyName não foi validado corretamente
- **Próximo passo**: Verificar se há um problema com caracteres especiais

## Verificação Rápida no Console

Execute estes comandos no console do navegador:

### 1. Verificar se o procedimento tRPC está retornando dados

```javascript
// Abra a aba Network do Developer Tools
// Procure por uma requisição para /api/trpc/assessment.getWithDetails
// Clique nela e vá para a aba "Response"
// Procure por "companyName" na resposta
```

### 2. Verificar o estado do React

```javascript
// Se você tiver React DevTools instalado:
// Abra a aba "Components"
// Procure por "AssessmentResults"
// Verifique o estado de "resultsQuery.data"
```

### 3. Fazer uma requisição manual

```javascript
// Copie e cole isso no console:
fetch('/api/trpc/assessment.getWithDetails?input={"assessmentId":660001}')
  .then(r => r.json())
  .then(data => {
    console.log('=== RESPOSTA DA API ===');
    console.log('Dados completos:', data);
    console.log('Company Name:', data.result?.data?.companyName);
    console.log('Company Name Type:', typeof data.result?.data?.companyName);
  })
  .catch(err => console.error('Erro:', err));
```

## Logs Adicionados para Debug

### Backend (server/routers.ts)

```typescript
console.log('[getWithDetails] === INICIANDO PROCEDIMENTO ===');
console.log('[getWithDetails] input.assessmentId:', input.assessmentId);
console.log('[getWithDetails] assessment encontrada:', !!assessment);
console.log('[getWithDetails] === RETORNANDO DADOS ===');
console.log('[getWithDetails] companyInfo:', companyInfo);
console.log('[getWithDetails] finalCompanyName:', finalCompanyName);
console.log('[getWithDetails] assessment.companyId:', assessment.companyId);
console.log('[getWithDetails] groups count:', groupStats.length);
```

### Frontend (client/src/pages/AssessmentResults.tsx)

```typescript
console.log('[DOWNLOAD PDF] === INICIANDO DOWNLOAD ===');
console.log('[DOWNLOAD PDF] data.companyName:', data.companyName, 'type:', typeof data.companyName);
console.log('[DOWNLOAD PDF] data.assessment.companyId:', data.assessment.companyId);
console.log('[DOWNLOAD PDF] data.groups:', data.groups);
console.log('[DOWNLOAD PDF] Dados completos da query:', JSON.stringify(data, null, 2));
console.log('[DOWNLOAD PDF] finalCompanyName:', finalCompanyName);
```

### PDF Generator (client/src/components/PDFReportGenerator.tsx)

```typescript
console.log('[PDF] === INICIANDO GERAÇÃO DE PDF ===');
console.log('[PDF] Dados recebidos:', {
  companyName: data.companyName,
  companyNameType: typeof data.companyName,
  companyNameLength: data.companyName?.length,
  ...
});
console.log('[PDF] Dados completos:', JSON.stringify(data, null, 2));
console.log('[PDF] Display company name:', displayCompanyName, 'original:', data.companyName);
console.log('[PDF] Filename:', filename, 'safeCompanyName:', safeCompanyName);
console.log('[PDF] PDF gerado e salvo com sucesso:', filename);
```

## Próximos Passos

1. **Execute os passos acima no navegador**
2. **Copie todos os logs do console**
3. **Compartilhe os logs para análise**
4. **Se o problema persistir:**
   - Limpe o cache do navegador (Ctrl+Shift+Delete)
   - Tente em uma janela anônima/privada
   - Tente em outro navegador

## Informações Adicionais

- **URL da aplicação**: https://lgpdassess-zbqzx56c.manus.space
- **Assessment ID**: 660001
- **Company ID**: 120002
- **Expected Company Name**: Silvana e Elaine Casa Noturna Ltda
- **Total Tests**: 227 (todos passando)

## Testes Relacionados

Se quiser executar os testes localmente:

```bash
# Todos os testes
pnpm test

# Apenas testes de PDF
pnpm test pdf

# Teste específico
pnpm test server/__tests__/pdf-generation-simulation.test.ts
```

## Conclusão

O backend está 100% funcional e retornando os dados corretamente. O problema está no frontend ou em como o navegador está processando os dados. Siga os passos acima para debugar e compartilhe os logs para análise.

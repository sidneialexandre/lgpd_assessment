# Guia de Debug - PDF Company Name Issue

## Resumo do Problema

O PDF está exibindo "Empresa 120002" ao invés de "Silvana e Elaine Casa Noturna Ltda".

## Análise Realizada

### Backend (Servidor)
✅ **FUNCIONANDO CORRETAMENTE**
- Banco de dados: Empresa 120002 tem razaoSocial = "Silvana e Elaine Casa Noturna Ltda"
- Procedimento `getWithDetails`: Retorna `companyName: "Silvana e Elaine Casa Noturna Ltda"`
- Testes: 224 testes passando, incluindo testes específicos de validação do nome da empresa

### Frontend (Navegador)
❓ **PRECISA SER DEBUGADO**
- O valor de `data.companyName` pode estar undefined ou vazio quando chega ao PDF
- O fallback "Empresa " + companyId está sendo usado

## Como Debugar no Navegador

### Passo 1: Abrir o Console do Navegador
1. Acesse a página de resultados: `https://lgpdassess-zbqzx56c.manus.space/assessment-results/660001?admin=true`
2. Abra o Developer Tools (F12 ou Ctrl+Shift+I)
3. Vá para a aba "Console"

### Passo 2: Clicar no Botão "Download Relatório PDF"
1. Clique no botão de download do PDF
2. Observe os logs no console

### Passo 3: Procurar pelos Logs de Debug

Você verá logs como:
```
[DOWNLOAD PDF] === INICIANDO DOWNLOAD ===
[DOWNLOAD PDF] data.companyName: ...
[DOWNLOAD PDF] data.assessment.companyId: 120002
[DOWNLOAD PDF] data.groups: ...
[DOWNLOAD PDF] Dados completos da query: ...
[DOWNLOAD PDF] finalCompanyName: ...
```

E depois:
```
[PDF] === INICIANDO GERAÇÃO DE PDF ===
[PDF] Dados recebidos: {
  companyName: ...,
  companyNameType: ...,
  ...
}
[PDF] Dados completos: ...
```

### Passo 4: Verificar os Valores

**Se `data.companyName` é undefined ou vazio:**
- Significa que o backend não está retornando o valor corretamente
- Verifique se o procedimento `getWithDetails` está sendo chamado corretamente

**Se `data.companyName` tem o valor correto:**
- Significa que o problema está na forma como o PDF está sendo gerado
- Verifique se o `companyName` está sendo usado corretamente no PDFReportGenerator

**Se `finalCompanyName` tem o valor correto:**
- Significa que o problema está no jsPDF
- Verifique se o jsPDF está renderizando o texto corretamente

## Logs Adicionados

### Backend (server/routers.ts)
```typescript
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
  assessmentNumber: data.assessmentNumber,
  totalScore: data.totalScore,
  compliancePercentage: data.compliancePercentage,
  groupsCount: data.groups?.length,
  pillarsCount: data.pillars?.length,
});
console.log('[PDF] Dados completos:', JSON.stringify(data, null, 2));
```

## Testes Criados

### 1. company-name-pdf.test.ts
- Verifica se a empresa 120002 tem o nome correto no banco de dados
- Verifica se a avaliação 660001 está associada à empresa 120002
- Verifica o tipo de companyId

### 2. pdf-company-name-integration.test.ts
- Simula o fluxo completo do PDF
- Verifica se o nome da empresa é retornado corretamente
- Verifica se o fallback não está sendo usado

### 3. pdf-flow-debug.test.ts
- Trace detalhado de todo o fluxo de dados
- Mostra exatamente o que o backend está retornando
- Simula a construção do reportData

## Próximos Passos

1. **Executar os testes no navegador:**
   - Abra a página de resultados
   - Abra o console
   - Clique no botão de download do PDF
   - Copie os logs do console

2. **Compartilhar os logs:**
   - Copie todos os logs que aparecerem no console
   - Compartilhe com o desenvolvedor para análise

3. **Se o problema persistir:**
   - Verifique se há um problema de cache do navegador
   - Limpe o cache (Ctrl+Shift+Delete)
   - Tente novamente

## Verificação Rápida

Para verificar rapidamente se o problema está no backend ou frontend:

1. Abra o console do navegador
2. Execute o seguinte comando:
```javascript
// Verificar se a API está retornando o nome correto
fetch('/api/trpc/assessment.getWithDetails?input={"assessmentId":660001}')
  .then(r => r.json())
  .then(data => {
    console.log('API Response:', data);
    console.log('Company Name:', data.result?.data?.companyName);
  });
```

Se `data.result?.data?.companyName` for "Silvana e Elaine Casa Noturna Ltda", o problema está no frontend.
Se for undefined ou "Empresa 120002", o problema está no backend.

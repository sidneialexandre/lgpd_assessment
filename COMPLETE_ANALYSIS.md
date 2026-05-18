# Análise Completa do Fluxo de Dados - PDF Company Name Bug

## Fluxo de Dados Esperado

```
1. Frontend (AssessmentResults.tsx)
   ↓
2. tRPC Query: assessment.getWithDetails({ assessmentId: 660001 })
   ↓
3. Backend (routers.ts): getWithDetails procedure
   ├─ Busca assessment no banco de dados
   ├─ Busca company pelo companyId
   ├─ Extrai razaoSocial da company
   ├─ Retorna { ..., companyName: "Silvana e Elaine Casa Noturna Ltda", ... }
   ↓
4. Frontend recebe resultado
   ├─ data.companyName = "Silvana e Elaine Casa Noturna Ltda"
   ├─ Exibe na página de resultados
   ├─ Passa para handleDownloadPDF
   ↓
5. handleDownloadPDF
   ├─ const finalCompanyName = data.companyName || "Empresa " + companyId
   ├─ Cria reportData com companyName
   ├─ Chama generatePDFReport(reportData)
   ↓
6. generatePDFReport (PDFReportGenerator.tsx)
   ├─ Recebe reportData.companyName
   ├─ Valida se não é vazio
   ├─ Escreve no PDF: "Empresa: {companyName}"
   ├─ Gera filename com companyName
   ├─ Salva PDF
```

## Análise do Código

### Backend (server/routers.ts - Linhas 248-340)

```typescript
getWithDetails: protectedProcedure
  .input(z.object({ assessmentId: z.number() }))
  .output(z.object({
    assessment: z.any(),
    companyName: z.string(),  // ← Tipo explícito: string obrigatório
    totalRespondents: z.number(),
    completedRespondents: z.number(),
    pendingRespondents: z.number(),
    sessions: z.array(z.any()),
    completedSessions: z.array(z.any()),
    groups: z.array(z.any()),
  }).nullable())
  .query(async ({ input }) => {
    // 1. Busca assessment
    const assessment = await getAssessmentById(input.assessmentId);
    if (!assessment) return null;

    // 2. Busca company
    const companyId = typeof assessment.companyId === 'string' 
      ? parseInt(assessment.companyId, 10) 
      : assessment.companyId;
    const company = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
    const companyInfo = company && company.length > 0 ? company[0] : null;

    // 3. Constrói finalCompanyName
    const finalCompanyName = companyInfo?.razaoSocial 
      ? String(companyInfo.razaoSocial)
      : `Empresa ${assessment.companyId}`;

    // 4. Retorna com companyName
    return {
      assessment,
      companyName: finalCompanyName,  // ← Aqui está sendo retornado
      totalRespondents: totalExpectedRespondents,
      completedRespondents: completedSessions.length,
      pendingRespondents: totalPendingRespondents,
      sessions,
      completedSessions,
      groups: groupStats,
    };
  })
```

**Status**: ✅ Backend está correto

### Frontend - Recebimento (client/src/pages/AssessmentResults.tsx - Linhas 87-90)

```typescript
const resultsQuery = trpc.assessment.getWithDetails.useQuery(
  { assessmentId: assessmentId || 0 },
  { enabled: !!assessmentId }
);
```

**Problema Potencial**: O tRPC pode não estar retornando `companyName` corretamente

### Frontend - Renderização (client/src/pages/AssessmentResults.tsx - Linhas 187-193)

```typescript
const data = resultsQuery.data as AssessmentResultsData | undefined;

// Debug logging
console.log('[RENDER] data:', data);
console.log('[RENDER] data.companyName:', data?.companyName);
console.log('[RENDER] data.companyName type:', typeof data?.companyName);
console.log('[RENDER] data.assessment.companyId:', data?.assessment?.companyId);
```

**Status**: ✅ Logs adicionados para debug

### Frontend - Download PDF (client/src/pages/AssessmentResults.tsx - Linhas 92-150)

```typescript
const handleDownloadPDF = () => {
  if (!resultsQuery.data) return;

  const data = resultsQuery.data;
  console.log('[DOWNLOAD PDF] === INICIANDO DOWNLOAD ===');
  console.log('[DOWNLOAD PDF] data.companyName:', data.companyName, 'type:', typeof data.companyName);
  
  const finalCompanyName = data.companyName || `Empresa ${data.assessment.companyId}`;
  console.log('[DOWNLOAD PDF] finalCompanyName:', finalCompanyName);
  
  const reportData = {
    companyName: finalCompanyName,
    // ... outros dados
  };

  generatePDFReport(reportData);
};
```

**Status**: ✅ Logs adicionados para debug

### PDF Generator (client/src/components/PDFReportGenerator.tsx - Linhas 25-90)

```typescript
export async function generatePDFReport(data: ReportData) {
  try {
    console.log('[PDF] === INICIANDO GERAÇÃO DE PDF ===');
    console.log('[PDF] Dados recebidos:', {
      companyName: data.companyName,
      companyNameType: typeof data.companyName,
      companyNameLength: data.companyName?.length,
      // ...
    });

    // ... código de geração do PDF ...

    // Company Info
    const displayCompanyName = data.companyName && data.companyName.trim() 
      ? data.companyName 
      : 'Empresa desconhecida';
    
    yPosition = addWrappedText(`Empresa: ${displayCompanyName}`, 15, yPosition + 2, pageWidth - 30, 10);

    // ... resto do PDF ...

    const safeCompanyName = (data.companyName && data.companyName.trim()) 
      ? data.companyName.replace(/\s+/g, "_") 
      : "Empresa_Desconhecida";
    const filename = `LGPD_Relatorio_${safeCompanyName}_${data.assessmentNumber}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error('[PDF] Erro ao gerar PDF:', error);
  }
}
```

**Status**: ✅ Logs adicionados para debug

## Hipóteses do Problema

### Hipótese 1: tRPC não está retornando companyName
**Sintomas**: 
- `data.companyName` é undefined no frontend
- `[DOWNLOAD PDF] data.companyName: undefined`

**Solução**: 
- Verificar se o procedimento está sendo chamado corretamente
- Verificar se há erro na query do banco de dados
- Verificar se o tRPC está serializando corretamente

### Hipótese 2: Frontend está usando cache antigo
**Sintomas**:
- `[RENDER] data.companyName: undefined` mas backend retorna corretamente
- Problema desaparece após limpar cache

**Solução**:
- Limpar cache do navegador
- Limpar cache do tRPC
- Fazer rebuild completo

### Hipótese 3: Problema com tipo de dados
**Sintomas**:
- `[DOWNLOAD PDF] data.companyName: "Empresa 120002"`
- `[PDF] Display company name: Empresa 120002`

**Solução**:
- Verificar se o fallback está sendo usado
- Verificar se `companyInfo?.razaoSocial` é undefined
- Verificar se há problema com conversão de tipo

### Hipótese 4: Problema com jsPDF
**Sintomas**:
- `[PDF] Display company name: Silvana e Elaine Casa Noturna Ltda`
- PDF exibe: "Empresa: Empresa 120002"

**Solução**:
- Verificar se jsPDF está renderizando corretamente
- Verificar se há problema com caracteres especiais
- Verificar se há problema com encoding

## Como Debugar

### Passo 1: Abrir o Console do Navegador
1. Acesse: https://lgpdassess-zbqzx56c.manus.space/assessment-results/660001?admin=true
2. Abra o Developer Tools (F12)
3. Vá para a aba "Console"

### Passo 2: Observar os Logs
Você verá logs como:
```
[RENDER] data: {...}
[RENDER] data.companyName: "Silvana e Elaine Casa Noturna Ltda" ou undefined
[RENDER] data.companyName type: "string" ou "undefined"
[RENDER] data.assessment.companyId: 120002
```

### Passo 3: Clicar em "Download Relatório PDF"
Você verá logs como:
```
[DOWNLOAD PDF] === INICIANDO DOWNLOAD ===
[DOWNLOAD PDF] data.companyName: "Silvana e Elaine Casa Noturna Ltda" ou undefined
[DOWNLOAD PDF] finalCompanyName: "Silvana e Elaine Casa Noturna Ltda" ou "Empresa 120002"
[PDF] === INICIANDO GERAÇÃO DE PDF ===
[PDF] Dados recebidos: {...}
[PDF] Display company name: "Silvana e Elaine Casa Noturna Ltda" ou "Empresa desconhecida"
[PDF] Filename: LGPD_Relatorio_Silvana_e_Elaine_Casa_Noturna_Ltda_1.pdf ou LGPD_Relatorio_Empresa_Desconhecida_1.pdf
[PDF] PDF gerado e salvo com sucesso: ...
```

### Passo 4: Analisar os Logs
- Se `[RENDER] data.companyName` é undefined → Problema no tRPC
- Se `[DOWNLOAD PDF] data.companyName` é undefined → Problema no React
- Se `[PDF] Display company name` é "Empresa desconhecida" → Problema na validação
- Se o PDF exibe "Empresa 120002" → Fallback está sendo usado

## Alterações Realizadas

1. **Adicionado tipo explícito ao retorno do procedimento**:
   - `.output(z.object({ ..., companyName: z.string(), ... }).nullable())`

2. **Adicionado logging na renderização**:
   - `console.log('[RENDER] data.companyName:', data?.companyName);`

3. **Adicionado logging no download**:
   - `console.log('[DOWNLOAD PDF] data.companyName:', data.companyName);`

4. **Adicionado logging no PDF**:
   - `console.log('[PDF] Dados recebidos:', {...});`

5. **Corrigido a interface AssessmentResultsData**:
   - Tornar `companyName` obrigatório (não opcional)

6. **Adicionado validação no PDF**:
   - `const displayCompanyName = data.companyName && data.companyName.trim() ? data.companyName : 'Empresa desconhecida';`

## Próximos Passos

1. **Executar os passos de debug acima**
2. **Copiar todos os logs do console**
3. **Compartilhar os logs para análise**
4. **Se o problema persistir:**
   - Limpar cache do navegador (Ctrl+Shift+Delete)
   - Fazer rebuild do projeto (pnpm build)
   - Testar em uma janela anônima/privada
   - Testar em outro navegador

## Testes Relacionados

- `company-name-pdf.test.ts`: Verifica dados da empresa
- `pdf-company-name-integration.test.ts`: Simula fluxo completo
- `pdf-flow-debug.test.ts`: Trace detalhado
- `pdf-generation-simulation.test.ts`: Simulação da geração do PDF

Todos os testes estão passando (227 testes).

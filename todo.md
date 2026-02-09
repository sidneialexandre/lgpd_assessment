# Avaliação de Conformidade LGPD - TODO

## Features Completadas (Recentes)

- [x] Gerar link único para respondentes acessarem a avaliação
- [x] Painel de administração para monitorar progresso da avaliação
- [x] Visualizar respondentes faltantes
- [x] Visualizar pontuação dos respondentes que completaram
- [x] Opção de finalizar avaliação antecipadamente
- [x] Calcular percentual de conformidade com respondentes que completaram

## Bugs Reportados

- [x] Painel de administração não está acessível/visível
- [x] Links únicos para respondentes não estão sendo gerados

## Bugs Corrigidos (Recentes)

- [x] Erro ao finalizar a avaliação e clicar em "Enviar Avaliação" (corrigido tratamento de compliancePercentage e removído useQuery de dentro de async)

## Bugs Corrigidos

- [x] Erro ao salvar avaliação ao final do respondente 1 (corrigido tipo de compliancePercentage)
- [x] Respondente pode avançar para próxima pergunta sem responder a pergunta atual
- [x] Adicionar validação obrigatória de resposta antes de clicar em "Próxima"

## Features Implementadas

- [x] 50 questões divididas em 3 pilares (Segurança, Conformidade, Cultura)
- [x] Sistema de múltiplos respondentes em até 6 grupos
- [x] Captura de CNPJ e Razão Social da empresa
- [x] Cálculo consolidado apenas quando todos responderem
- [x] Armazenamento de respostas por respondente individual
- [x] Label da alternativa D alterado para "Não sei"
- [x] Máximo de 100.000 pontos
- [x] Página de seleção de respondente
- [x] Relatório final com dados da empresa





## Ajustes Solicitados (Completados)

- [x] Exibir configurações originais de grupos no painel de administração
- [x] Gerar links para TODOS os respondentes na página de configuração
- [x] Corrigir cálculo de pontuação (máximo 10.000 por respondente, não 100.000)
- [x] Corrigir barra de progresso para considerar todos os respondentes
- [x] Consertar botão finalizar avaliação
- [x] Exibir respondentes faltantes por grupo



## Novos Ajustes Solicitados (Completados)

- [x] Adicionar acesso ao painel de seleção de respondentes no painel admin
- [x] Implementar função de remover avaliação completamente do banco de dados
- [x] Corrigir computação de avaliações no painel de visualização
- [x] Corrigir barra de progresso para funcionar corretamente
- [x] Consertar botão finalizar avaliação
- [x] Gerar links na página de seleção de respondentes (antes da avaliação ser respondida)




## Bugs Reportados (Corrigidos)

- [x] Erro ao finalizar avaliação via link: "Dados da sessão não encontrados"



## Problemas Críticos Reportados (Corrigidos)

- [x] Deletar avaliação não permite criar nova para mesma empresa
- [x] Erro ao finalizar avaliação via link: dados de sessão não encontrados
- [x] Respondente tem acesso ao painel admin (deve ser apenas admin)
- [x] Link do respondente deve ir direto para avaliação, não para home




## Novos Problemas Reportados (Corrigidos)

- [x] Respondente autenticado tem acesso ao painel admin (deve ter acesso apenas ao questionário)
- [x] Erro ao criar nova avaliação para empresa existente
- [x] Pré-preenchimento de dados da última avaliação não funciona



## Melhorias Solicitadas (Completadas)

- [x] Verificar avaliações anteriores apenas se existirem (evitar loops)
- [x] Implementar sistema de roles: admin (acesso completo) e respondente (apenas questionário)
- [x] Restringir acesso de respondentes autenticados apenas ao questionário
- [x] Criar painel de login/cadastro para respondentes
- [x] Respondentes devem preencher questionário e enviar respostas sem acesso ao painel admin


## Bugs Críticos Corrigidos (Sessão Atual)

- [x] Duplicação de grupos em CompanySetup - Adicionada flag `hasLoadedGroups` para evitar múltiplas execuções do useEffect
- [x] Link de respondente não exibido após login - Criada página RespondentDashboard que mostra links de avaliação disponíveis
- [x] Contagem de respondentes não atualizando - Corrigido cálculo em `getWithDetails` para usar número esperado de respondentes por grupo
- [x] Barra de progresso não atualizando - Corrigido com a atualização anterior do cálculo de respondentes

## Novas Funcionalidades Implementadas (Sessão Atual)

- [x] Página RespondentDashboard para respondentes autenticados verem seus links
- [x] Procedimento `respondent.getAvailableAssessments` para buscar avaliações disponíveis
- [x] Função `getRespondentSessionsByEmail` no backend para buscar respondentes
- [x] Rota `/respondent-dashboard` no App.tsx
- [x] Atualização de Home.tsx para mostrar botão "Minhas Avaliações" para respondentes


## Correção Adicional - Duplicação de Grupos (Sessão Atual)

- [x] Duplicação de grupos ao clicar em "Próximo Passo" - Corrigido resetando grupos ANTES de carregar dados pré-preenchidos no segundo useEffect
- [x] Duplicação ao deletar e reiniciar avaliação - Corrigido resetando estado completo quando não há companyId na URL
- [x] Lógica de newGroup - Atualizada para calcular corretamente o número do próximo grupo após carregar dados


## Bug Crítico - Duplicação de Grupos ao Deletar/Reiniciar (Sessão Atual)

- [x] Grupos estão duplicando ao deletar avaliação e criar nova para mesma empresa - CORRIGIDO
- [x] Máximo de 6 grupos não está sendo respeitado ao carregar dados anteriores - CORRIGIDO
- [x] Grupos da avaliação anterior estão migrando para nova avaliação com duplicação - CORRIGIDO

## Correções Implementadas

- [x] Função `getLastAssessmentWithGroups` - Agora retorna apenas grupos usados na última avaliação
- [x] Função `getWithDetails` - Agora filtra grupos para apenas os usados na avaliação atual
- [x] Frontend CompanySetup.tsx - Adicionado limite de 6 grupos ao carregar dados pré-preenchidos
- [x] Backend - Garantido máximo de 6 grupos em todas as operações


## Bugs Reportados - Nova Sessão

- [x] Duplicação de grupos - CORRIGIDO com getByAssessment
- [x] Painel de administração - OK (totais corretos)
- [x] Respondentes pendentes/completados - OK (totais corretos)
- [x] Barra de progresso - OK (reflete total correto)
- [x] Página de definição de grupos - CORRIGIDO com barra de progresso


## Bug Crítico - Grupos Não Estão Sendo Salvos

- [x] Grupos G1 a G6 não estão sendo salvos ao clicar em Próximo Passo - CORRIGIDO
- [x] Painel de administração mostra que nenhum grupo foi configurado após salvar - CORRIGIDO
- [x] Fluxo de salvamento de grupos precisa ser investigado e corrigido - CORRIGIDO

## Correção Implementada

- [x] Criada função `createRespondentSessionsForAssessment` que cria automaticamente sessões para todos os respondentes
- [x] Modificado procedimento `assessment.create` para chamar a nova função
- [x] Agora quando uma avaliação é criada, todas as sessões de respondentes são criadas automaticamente


## Bug Crítico - Duplicação de Grupos Entre Avaliações (Nova Sessão)

- [x] Grupos de avaliações anteriores sendo carregados - CORRIGIDO
- [x] Sistema confundindo grupos de diferentes avaliações - CORRIGIDO
- [x] Grupos antigos aparecendo em novas avaliações - CORRIGIDO
- [x] Isolamento de grupos por avaliação - CORRIGIDO
- [x] Sugestão apenas da última avaliação - CORRIGIDO

## Correções Implementadas - Duplicação

- [x] Modificada `getLastAssessmentWithGroups` para buscar APENAS grupos da última avaliação usando inArray
- [x] Modificada `createGroup` para fazer upsert (criar ou atualizar se já existir)
- [x] Agora grupos com mesmo nome são reutilizados em novas avaliações, evitando duplicação


## Bug Crítico - Duplicação de Grupos em Novas Avaliações (Nova Sessão)

- [ ] Duplicação de grupos ao iniciar nova avaliação para mesma empresa
- [ ] Cada avaliação precisa ter identificador único (Avaliação 1, Avaliação 2, etc)
- [ ] Grupos não devem ser compartilhados entre avaliações
- [ ] Cada avaliação deve ter sua própria configuração isolada de grupos
- [ ] Necessário criar tabela de associação assessment_groups


## Correções Implementadas - Isolamento de Avaliações

- [x] Criada tabela `assessmentGroups` para associar grupos a avaliações
- [x] Adicionado campo `assessmentNumber` à tabela assessments (1, 2, 3, etc)
- [x] Criada função `getNextAssessmentNumber` para calcular próximo número
- [x] Modificada `createAssessment` para usar assessmentNumber
- [x] Criada função `createAssessmentGroupsForAssessment` para isolar grupos
- [x] Cada avaliação agora tem sua própria configuração de grupos isolada
- [x] Grupos não são mais duplicados entre avaliações


## Correção Final - Fluxo de Criação de Grupos Isolados (Nova Sessão)

- [x] Corrigido erro de sintaxe em routers.ts - createForAssessment estava fora do router
- [x] Adicionado procedimento `group.createForAssessment` em routers.ts
- [x] Criada função `createGroupForAssessment` em db.ts que:
  - Cria grupos isolados para uma avaliação específica
  - Previne duplicação de nomes de grupos dentro da mesma avaliação
  - Cria automaticamente sessões de respondentes para cada grupo
  - Usa a tabela assessmentGroups para manter associação
- [x] Atualizado CompanySetup.tsx para usar novo fluxo:
  - Criar empresa primeiro
  - Criar avaliação (recebe assessmentId)
  - Criar grupos isolados para essa avaliação usando createForAssessment
- [x] Criados testes vitest para validar lógica de isolamento de grupos
- [x] Todos os 8 testes passaram com sucesso

## Fluxo Correto Agora Implementado

1. Usuário preenche dados da empresa (CNPJ, Razão Social)
2. Usuário adiciona grupos G1-G6 com departamentos e quantidade de respondentes
3. Clica em "Próximo Passo":
   - Cria/obtém a empresa
   - Cria uma nova avaliação (com assessmentNumber único)
   - Cria cada grupo isolado para essa avaliação
   - Cria automaticamente sessões de respondentes para cada grupo
4. Redireciona para seleção de respondentes
5. Cada avaliação tem sua própria configuração de grupos (sem duplicação)

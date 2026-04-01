# 📖 Guia Completo: Hospedagem no GitHub Pages - Passo a Passo

Este guia detalha como hospedar a aplicação **Avaliação de Conformidade LGPD** no GitHub Pages com sucesso.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Opção 1: GitHub Pages com Branch `gh-pages` (Recomendado)](#opção-1-github-pages-com-branch-gh-pages-recomendado)
3. [Opção 2: GitHub Pages com Pasta `/docs`](#opção-2-github-pages-com-pasta-docs)
4. [Opção 3: GitHub Pages com GitHub Actions (Automático)](#opção-3-github-pages-com-github-actions-automático)
5. [Verificação e Troubleshooting](#verificação-e-troubleshooting)
6. [Próximos Passos](#próximos-passos)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de que você tem:

- ✅ Uma conta no GitHub (https://github.com)
- ✅ Git instalado no seu computador
- ✅ Node.js 18+ e pnpm instalados
- ✅ O repositório do projeto já criado no GitHub
- ✅ Acesso de administrador ao repositório

### Verificar se tudo está instalado:

```bash
# Verificar Node.js
node --version
# Deve mostrar: v18.0.0 ou superior

# Verificar pnpm
pnpm --version
# Deve mostrar: 8.0.0 ou superior

# Verificar Git
git --version
# Deve mostrar: git version 2.x.x ou superior
```

---

## 🚀 Opção 1: GitHub Pages com Branch `gh-pages` (Recomendado)

Esta é a opção **mais simples e recomendada** para começar.

### Passo 1: Clonar o Repositório Localmente

```bash
# Substituir USERNAME e REPOSITORY pelos seus valores
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
```

**Exemplo:**
```bash
git clone https://github.com/joaosilva/lgpd-assessment.git
cd lgpd-assessment
```

### Passo 2: Instalar Dependências

```bash
# Instalar todas as dependências do projeto
pnpm install

# Verificar se a instalação foi bem-sucedida
pnpm list
```

**Saída esperada:**
```
lgpd_assessment@1.0.0 /home/user/lgpd-assessment

dependencies (11):
├── @trpc/client@11.0.0
├── react@19.2.0
├── react-dom@19.2.0
├── wouter@3.2.1
└── ... (outras dependências)
```

### Passo 3: Fazer Build da Aplicação

```bash
# Compilar a aplicação para produção
pnpm build

# Verificar se o build foi bem-sucedido
ls -la dist/
```

**Saída esperada:**
```
dist/
├── index.html
├── index.js
├── public/
│   ├── index.html
│   ├── assets/
│   │   ├── index.es-xxxxx.js
│   │   ├── index-xxxxx.css
│   │   └── ...
│   └── 404.html
└── ...
```

### Passo 4: Instalar Pacote `gh-pages`

```bash
# Instalar o pacote gh-pages como dependência de desenvolvimento
pnpm add -D gh-pages

# Verificar instalação
pnpm list gh-pages
```

### Passo 5: Configurar Scripts no `package.json`

Abra o arquivo `package.json` e adicione os seguintes scripts:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "dev": "concurrently \"vite\" \"tsx watch server/_core/index.ts\"",
    "test": "vitest",
    "predeploy": "pnpm build",
    "deploy": "gh-pages -d dist/public"
  }
}
```

**O que cada script faz:**
- `predeploy`: Executado automaticamente antes de `deploy`, faz o build
- `deploy`: Envia os arquivos do `dist/public` para o branch `gh-pages`

### Passo 6: Fazer Deploy para GitHub Pages

```bash
# Executar o deploy (predeploy será executado automaticamente)
pnpm deploy

# Aguarde alguns segundos...
```

**Saída esperada:**
```
> gh-pages -d dist/public

Published
```

### Passo 7: Configurar GitHub Pages no Repositório

1. Acesse seu repositório no GitHub: `https://github.com/USERNAME/REPOSITORY`
2. Clique em **Settings** (Configurações) no menu superior
3. No menu lateral esquerdo, clique em **Pages**
4. Em **Source**, selecione:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
5. Clique em **Save**

**Imagem de referência:**
```
┌─────────────────────────────────────────┐
│ GitHub Repository Settings              │
├─────────────────────────────────────────┤
│ ⚙️ Settings                             │
│   📄 Code                               │
│   🔐 Security                           │
│   🌐 Pages                    ← CLIQUE  │
│   ⚡ Actions                            │
│   📦 Packages                           │
└─────────────────────────────────────────┘
```

### Passo 8: Aguardar Deploy e Acessar

1. Aguarde 1-2 minutos para o GitHub processar o deploy
2. Atualize a página de Settings → Pages
3. Você verá uma mensagem: **"Your site is live at https://USERNAME.github.io/REPOSITORY/"**
4. Clique no link para acessar sua aplicação

**Exemplo de URL:**
```
https://joaosilva.github.io/lgpd-assessment/
```

---

## 📁 Opção 2: GitHub Pages com Pasta `/docs`

Esta opção é útil se você quer manter tudo no branch `main`.

### Passo 1-2: Clonar e Instalar (igual à Opção 1)

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
pnpm install
```

### Passo 3: Fazer Build

```bash
pnpm build
```

### Passo 4: Criar Pasta `/docs` e Copiar Arquivos

```bash
# Criar pasta docs se não existir
mkdir -p docs

# Copiar arquivos do build para docs
cp -r dist/public/* docs/

# Verificar se os arquivos foram copiados
ls -la docs/
```

**Saída esperada:**
```
docs/
├── index.html
├── 404.html
├── assets/
│   ├── index.es-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
└── ...
```

### Passo 5: Fazer Commit e Push

```bash
# Adicionar os arquivos ao git
git add docs/

# Fazer commit
git commit -m "Deploy para GitHub Pages - pasta /docs"

# Fazer push para o repositório
git push origin main
```

### Passo 6: Configurar GitHub Pages

1. Acesse **Settings** → **Pages**
2. Em **Source**, selecione:
   - **Branch**: `main`
   - **Folder**: `/docs`
3. Clique em **Save**

### Passo 7: Acessar a Aplicação

Aguarde 1-2 minutos e acesse: `https://USERNAME.github.io/REPOSITORY/`

---

## ⚙️ Opção 3: GitHub Pages com GitHub Actions (Automático)

Esta opção automatiza o deploy toda vez que você faz push no repositório.

### Passo 1-2: Clonar e Instalar (igual às opções anteriores)

```bash
git clone https://github.com/USERNAME/REPOSITORY.git
cd REPOSITORY
pnpm install
```

### Passo 3: Criar Arquivo de Workflow

Crie o arquivo `.github/workflows/deploy.yml`:

```bash
# Criar diretório se não existir
mkdir -p .github/workflows

# Criar arquivo deploy.yml
touch .github/workflows/deploy.yml
```

### Passo 4: Adicionar Configuração do Workflow

Abra `.github/workflows/deploy.yml` e adicione:

```yaml
name: Deploy para GitHub Pages

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    # 1. Fazer checkout do código
    - name: 📥 Checkout código
      uses: actions/checkout@v4
    
    # 2. Configurar Node.js
    - name: 🔧 Configurar Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    # 3. Instalar pnpm
    - name: 📦 Instalar pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 10
    
    # 4. Instalar dependências
    - name: 📚 Instalar dependências
      run: pnpm install
    
    # 5. Fazer build
    - name: 🏗️ Fazer build
      run: pnpm build
    
    # 6. Deploy para GitHub Pages
    - name: 🚀 Deploy para GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist/public
```

### Passo 5: Fazer Commit e Push

```bash
# Adicionar o arquivo de workflow
git add .github/workflows/deploy.yml

# Fazer commit
git commit -m "Adicionar GitHub Actions para deploy automático"

# Fazer push
git push origin main
```

### Passo 6: Configurar GitHub Pages

1. Acesse **Settings** → **Pages**
2. Em **Source**, selecione:
   - **Branch**: `gh-pages`
   - **Folder**: `/ (root)`
3. Clique em **Save**

### Passo 7: Monitorar Deploy

1. Acesse a aba **Actions** do seu repositório
2. Você verá o workflow "Deploy para GitHub Pages" em execução
3. Aguarde até que fique verde (✅)
4. Acesse sua aplicação em: `https://USERNAME.github.io/REPOSITORY/`

**Exemplo de execução:**
```
✅ Deploy para GitHub Pages
   ├── 📥 Checkout código (2s)
   ├── 🔧 Configurar Node.js (5s)
   ├── 📦 Instalar pnpm (3s)
   ├── 📚 Instalar dependências (45s)
   ├── 🏗️ Fazer build (15s)
   └── 🚀 Deploy para GitHub Pages (8s)
   
   Total: ~1 minuto 18 segundos
```

---

## ✅ Verificação e Troubleshooting

### Verificação: Confirmar que o Deploy foi Bem-Sucedido

#### 1. Verificar no GitHub

```bash
# Acessar seu repositório
https://github.com/USERNAME/REPOSITORY/settings/pages
```

Você deve ver:
```
✅ Your site is live at https://USERNAME.github.io/REPOSITORY/
```

#### 2. Verificar os Arquivos Deployados

```bash
# Se usou gh-pages
https://github.com/USERNAME/REPOSITORY/tree/gh-pages

# Se usou /docs
https://github.com/USERNAME/REPOSITORY/tree/main/docs
```

#### 3. Testar a Aplicação

1. Acesse: `https://USERNAME.github.io/REPOSITORY/`
2. Verifique se a página carrega corretamente
3. Teste as rotas:
   - Clique em "Iniciar Avaliação"
   - Teste o painel de administração
   - Verifique se os QR codes aparecem

### Troubleshooting: Problemas Comuns

#### ❌ Problema: Página em Branco

**Causa:** Caminhos dos assets estão incorretos.

**Solução:**

1. Abra o console do navegador (F12)
2. Procure por erros 404 em arquivos `.js` ou `.css`
3. Verifique se o `vite.config.ts` tem a configuração correta:

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' 
    ? '/lgpd-assessment/'  // Substituir pelo nome do repositório
    : '/',
  // ... resto da configuração
});
```

4. Refaça o build:
```bash
pnpm build
pnpm deploy  # ou copie para /docs e faça push
```

#### ❌ Problema: Rotas Não Funcionam (404 ao atualizar página)

**Causa:** GitHub Pages não sabe como rotear para a SPA.

**Solução:**

1. Verifique se o arquivo `public/404.html` existe:
```bash
ls -la public/404.html
```

2. Se não existir, crie-o:
```bash
# Já foi criado no projeto, mas se precisar recriar:
cat > public/404.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <script>
        var redirect = sessionStorage.redirect;
        delete sessionStorage.redirect;
        if (redirect && redirect !== location.href) {
            history.replaceState(null, null, redirect);
        }
    </script>
</head>
<body>
    <script>
        window.location.href = '/';
    </script>
</body>
</html>
EOF
```

3. Refaça o build e deploy:
```bash
pnpm build
pnpm deploy
```

#### ❌ Problema: "Permission denied" ao fazer deploy

**Causa:** Falta de permissão para escrever no repositório.

**Solução:**

1. Verifique se você tem permissão de escrita:
```bash
git push origin main
```

2. Se receber erro, configure suas credenciais Git:
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"
```

3. Se ainda não funcionar, gere um token de acesso pessoal:
   - Acesse: https://github.com/settings/tokens
   - Clique em "Generate new token"
   - Selecione `repo` e `workflow`
   - Copie o token
   - Use como senha ao fazer push

#### ❌ Problema: "gh-pages" não encontrado

**Causa:** Pacote `gh-pages` não foi instalado.

**Solução:**

```bash
# Instalar o pacote
pnpm add -D gh-pages

# Verificar instalação
pnpm list gh-pages

# Tentar deploy novamente
pnpm deploy
```

#### ❌ Problema: Build falha com erro de TypeScript

**Causa:** Erros de tipo no código.

**Solução:**

```bash
# Verificar erros de TypeScript
pnpm build

# Ver detalhes dos erros
npx tsc --noEmit

# Corrigir os erros e tentar novamente
pnpm build
```

---

## 🔗 URLs Esperadas

Dependendo do seu repositório, as URLs serão diferentes:

### Cenário 1: Repositório Específico

**Nome do repositório:** `lgpd-assessment`  
**URL base:** `https://username.github.io/lgpd-assessment/`

**Rotas da aplicação:**
```
https://username.github.io/lgpd-assessment/                    # Home
https://username.github.io/lgpd-assessment/admin              # Painel Admin
https://username.github.io/lgpd-assessment/respondent?token=xxx  # Respondente
```

### Cenário 2: Página Principal (username.github.io)

**Nome do repositório:** `username.github.io`  
**URL base:** `https://username.github.io/`

**Rotas da aplicação:**
```
https://username.github.io/                    # Home
https://username.github.io/admin              # Painel Admin
https://username.github.io/respondent?token=xxx  # Respondente
```

---

## 📊 Comparação das Opções

| Aspecto | Opção 1 (gh-pages) | Opção 2 (/docs) | Opção 3 (Actions) |
|--------|-------------------|-----------------|------------------|
| **Dificuldade** | ⭐ Fácil | ⭐⭐ Médio | ⭐⭐⭐ Avançado |
| **Automatização** | Manual | Manual | ✅ Automático |
| **Velocidade Setup** | 5 min | 5 min | 10 min |
| **Manutenção** | Baixa | Baixa | Muito Baixa |
| **Recomendado para** | Iniciantes | Controle total | Produção |

---

## 🎯 Próximos Passos

Após hospedar no GitHub Pages, considere:

1. **Adicionar Domínio Customizado**
   - Criar arquivo `CNAME` com seu domínio
   - Configurar DNS no seu provedor

2. **Implementar Analytics**
   - Google Analytics
   - Plausible Analytics

3. **Configurar Certificado SSL**
   - GitHub Pages fornece HTTPS automático
   - Domínios customizados precisam de configuração adicional

4. **Monitorar Performance**
   - Usar Google Lighthouse
   - Otimizar bundle size

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique a [documentação oficial do GitHub Pages](https://docs.github.com/en/pages)
2. Procure por erros no console do navegador (F12)
3. Verifique os logs do GitHub Actions (aba Actions do repositório)
4. Consulte a seção [Troubleshooting](#troubleshooting-problemas-comuns) acima

---

## 📝 Checklist Final

Antes de considerar o deploy completo, verifique:

- [ ] Aplicação funciona localmente (`pnpm dev`)
- [ ] Build é bem-sucedido (`pnpm build`)
- [ ] Todos os testes passam (`pnpm test`)
- [ ] Repositório está criado no GitHub
- [ ] Você escolheu uma das 3 opções de deployment
- [ ] GitHub Pages está configurado corretamente
- [ ] Aplicação está acessível em `https://USERNAME.github.io/REPOSITORY/`
- [ ] Todas as rotas funcionam (home, admin, respondent)
- [ ] QR codes aparecem corretamente
- [ ] PDF pode ser gerado e baixado
- [ ] Links de respondentes funcionam

---

**Parabéns! 🎉 Sua aplicação está hospedada no GitHub Pages!**

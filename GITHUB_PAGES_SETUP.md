# Configuração para Hospedagem no GitHub Pages

Este guia explica como hospedar a aplicação LGPD Assessment no GitHub Pages.

## Opção 1: Usando Branch `gh-pages` (Recomendado)

### Passo 1: Configurar o GitHub Pages

1. Vá para as configurações do seu repositório no GitHub
2. Acesse a seção **Pages** (Configurações → Pages)
3. Em "Source", selecione o branch `gh-pages`
4. Clique em "Save"

### Passo 2: Build e Deploy

```bash
# Fazer build da aplicação
pnpm build

# Copiar os arquivos de build para gh-pages
# Você pode usar o gh-pages package ou fazer manualmente
pnpm add -D gh-pages

# Adicionar scripts no package.json:
# "deploy": "gh-pages -d dist"
# "predeploy": "pnpm build"

# Fazer deploy
pnpm deploy
```

## Opção 2: Usando `/docs` Folder

### Passo 1: Configurar o GitHub Pages

1. Vá para as configurações do seu repositório no GitHub
2. Acesse a seção **Pages** (Configurações → Pages)
3. Em "Source", selecione `main` branch e `/docs` folder
4. Clique em "Save"

### Passo 2: Build e Deploy

```bash
# Fazer build da aplicação
pnpm build

# Copiar os arquivos de build para a pasta /docs
cp -r dist/* docs/

# Fazer commit e push
git add docs/
git commit -m "Deploy para GitHub Pages"
git push origin main
```

## Opção 3: Usando GitHub Actions (Automático)

Crie um arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 10
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Build
      run: pnpm build
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## Estrutura de Arquivos

```
projeto/
├── index.html              # Página de redirecionamento (raiz)
├── public/
│   └── 404.html           # Para SPA routing no GitHub Pages
├── client/
│   └── src/
│       └── pages/
├── dist/                  # Build output (gerado por pnpm build)
└── package.json
```

## Redirecionamento de Rotas SPA

Para que as rotas da SPA funcionem corretamente no GitHub Pages:

1. O arquivo `public/404.html` é carregado quando uma rota não é encontrada
2. Este arquivo redireciona para `index.html`
3. A aplicação React (wouter) cuida do roteamento no cliente

## URLs Esperadas

### Se o repositório é `username/lgpd-assessment`:
- URL base: `https://username.github.io/lgpd-assessment/`
- Rotas: `https://username.github.io/lgpd-assessment/admin`, etc.

### Se o repositório é `username.github.io`:
- URL base: `https://username.github.io/`
- Rotas: `https://username.github.io/admin`, etc.

## Troubleshooting

### Problema: Página em branco após deploy

**Solução**: Verifique se o `vite.config.ts` tem a configuração correta de `base`:

```typescript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' 
    ? '/lgpd-assessment/' // Substitua pelo nome do seu repositório
    : '/',
  // ... resto da configuração
});
```

### Problema: Assets (CSS, JS) não carregam

**Solução**: Verifique se os caminhos dos assets estão corretos no arquivo gerado `dist/index.html`. Eles devem ser relativos ao `base` configurado.

### Problema: Rotas não funcionam

**Solução**: Certifique-se de que:
1. O arquivo `public/404.html` foi copiado para `dist/`
2. O GitHub Pages está configurado para servir do branch/pasta correto
3. A aplicação está usando `wouter` para roteamento (já configurado)

## Verificação

Após fazer deploy, verifique:

1. Acesse a URL base da sua aplicação
2. Navegue entre as páginas
3. Atualize a página (F5) em uma rota que não seja a raiz
4. Verifique se os assets (CSS, JS, imagens) carregam corretamente

## Suporte

Para mais informações sobre GitHub Pages, visite:
https://docs.github.com/en/pages/getting-started-with-github-pages

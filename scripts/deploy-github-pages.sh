#!/bin/bash

# ============================================================================
# Script de Deploy Automático para GitHub Pages
# ============================================================================
# Este script automatiza o processo de deployment para GitHub Pages
# Suporta 3 opções: gh-pages, /docs, ou GitHub Actions
#
# Uso: ./scripts/deploy-github-pages.sh [opção]
# Opções: gh-pages, docs, actions
# ============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de utilidade
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar pré-requisitos
check_prerequisites() {
    print_header "Verificando Pré-requisitos"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js não está instalado"
        exit 1
    fi
    print_success "Node.js $(node --version) encontrado"
    
    # Verificar pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm não está instalado"
        exit 1
    fi
    print_success "pnpm $(pnpm --version) encontrado"
    
    # Verificar Git
    if ! command -v git &> /dev/null; then
        print_error "Git não está instalado"
        exit 1
    fi
    print_success "Git $(git --version | awk '{print $3}') encontrado"
    
    # Verificar se está em um repositório Git
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Não está em um repositório Git"
        exit 1
    fi
    print_success "Repositório Git encontrado"
}

# Instalar dependências
install_dependencies() {
    print_header "Instalando Dependências"
    
    print_info "Executando: pnpm install"
    pnpm install
    
    print_success "Dependências instaladas com sucesso"
}

# Fazer build
build_project() {
    print_header "Compilando Projeto"
    
    print_info "Executando: pnpm build"
    pnpm build
    
    if [ ! -d "dist/public" ]; then
        print_error "Pasta dist/public não foi criada"
        exit 1
    fi
    
    print_success "Build compilado com sucesso"
    print_info "Arquivos em: $(pwd)/dist/public"
}

# Opção 1: Deploy com gh-pages
deploy_gh_pages() {
    print_header "Deploy com gh-pages"
    
    # Verificar se gh-pages está instalado
    if ! pnpm list gh-pages > /dev/null 2>&1; then
        print_info "Instalando gh-pages..."
        pnpm add -D gh-pages
    fi
    
    print_info "Fazendo deploy para branch gh-pages..."
    pnpm exec gh-pages -d dist/public
    
    print_success "Deploy realizado com sucesso!"
    print_info "Sua aplicação estará disponível em:"
    print_info "https://$(git config user.name | tr ' ' '-' | tr '[:upper:]' '[:lower:]').github.io/$(basename $(git rev-parse --show-toplevel))/"
}

# Opção 2: Deploy com /docs
deploy_docs_folder() {
    print_header "Deploy com Pasta /docs"
    
    # Criar pasta docs se não existir
    if [ ! -d "docs" ]; then
        print_info "Criando pasta docs..."
        mkdir -p docs
    fi
    
    # Copiar arquivos
    print_info "Copiando arquivos do build para docs..."
    cp -r dist/public/* docs/
    
    # Verificar se os arquivos foram copiados
    if [ ! -f "docs/index.html" ]; then
        print_error "Falha ao copiar arquivos para docs"
        exit 1
    fi
    
    print_success "Arquivos copiados com sucesso"
    
    # Fazer commit e push
    print_info "Fazendo commit..."
    git add docs/
    git commit -m "Deploy para GitHub Pages - pasta /docs" || print_warning "Nada para fazer commit"
    
    print_info "Fazendo push..."
    git push origin main
    
    print_success "Deploy realizado com sucesso!"
    print_info "Sua aplicação estará disponível em:"
    print_info "https://$(git config user.name | tr ' ' '-' | tr '[:upper:]' '[:lower:]').github.io/$(basename $(git rev-parse --show-toplevel))/"
}

# Opção 3: Configurar GitHub Actions
setup_github_actions() {
    print_header "Configurando GitHub Actions"
    
    # Criar diretório de workflows
    mkdir -p .github/workflows
    
    # Criar arquivo de workflow
    cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy para GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: 📥 Checkout código
      uses: actions/checkout@v4
    
    - name: 🔧 Configurar Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
    
    - name: 📦 Instalar pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 10
    
    - name: 📚 Instalar dependências
      run: pnpm install
    
    - name: 🏗️ Fazer build
      run: pnpm build
    
    - name: 🚀 Deploy para GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist/public
EOF
    
    print_success "Arquivo de workflow criado: .github/workflows/deploy.yml"
    
    # Fazer commit e push
    print_info "Fazendo commit..."
    git add .github/workflows/deploy.yml
    git commit -m "Adicionar GitHub Actions para deploy automático" || print_warning "Nada para fazer commit"
    
    print_info "Fazendo push..."
    git push origin main
    
    print_success "GitHub Actions configurado com sucesso!"
    print_info "O deploy será automático a cada push no branch main"
    print_info "Monitore em: https://github.com/USERNAME/REPOSITORY/actions"
}

# Menu de seleção
show_menu() {
    print_header "Escolha uma Opção de Deploy"
    
    echo "1) gh-pages (Recomendado - Mais Simples)"
    echo "2) /docs (Controle Total)"
    echo "3) GitHub Actions (Automático)"
    echo "4) Sair"
    echo ""
    read -p "Selecione uma opção (1-4): " choice
    
    case $choice in
        1)
            deploy_gh_pages
            ;;
        2)
            deploy_docs_folder
            ;;
        3)
            setup_github_actions
            ;;
        4)
            print_info "Saindo..."
            exit 0
            ;;
        *)
            print_error "Opção inválida"
            show_menu
            ;;
    esac
}

# Função principal
main() {
    print_header "🚀 Deploy para GitHub Pages"
    
    # Verificar argumentos
    if [ $# -eq 0 ]; then
        # Sem argumentos, mostrar menu
        check_prerequisites
        install_dependencies
        build_project
        show_menu
    else
        # Com argumentos, executar diretamente
        option=$1
        check_prerequisites
        install_dependencies
        build_project
        
        case $option in
            gh-pages)
                deploy_gh_pages
                ;;
            docs)
                deploy_docs_folder
                ;;
            actions)
                setup_github_actions
                ;;
            *)
                print_error "Opção desconhecida: $option"
                echo "Uso: $0 [gh-pages|docs|actions]"
                exit 1
                ;;
        esac
    fi
    
    print_header "✅ Deploy Concluído!"
    print_success "Sua aplicação será processada pelo GitHub Pages em 1-2 minutos"
    print_info "Acesse as configurações do repositório em: Settings → Pages"
}

# Executar função principal
main "$@"

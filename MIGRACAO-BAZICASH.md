# Migração Bazicash - Floating Button e Página

Guia para migrar o sistema Bazicash (floating button e página) para outra loja Shopify mantendo ambiente local.

## Pré-requisitos

- Shopify CLI instalado
- Acesso à nova loja Shopify
- Theme Kit ou Shopify CLI configurado

## Arquivos a Migrar

### Assets
- `assets/bazicash.css`
- `assets/bazicash.js`
- `assets/bazicash-icon.png`
- `assets/banner-bzh.png`

### Sections
- `sections/floating-button.liquid`
- `sections/bazicash-page.liquid`
- `sections/bazicash-info-banner.liquid`

### Snippets
- `snippets/bazicash-floating-button.liquid`
- `snippets/bazicash-balance-section.liquid`
- `snippets/bazicash-footer-link.liquid`

### Templates
- `templates/page.bazicash.json`

### Layout (se necessário)
- Verificar modificações em `sections/footer.liquid`

## Passo a Passo

### 1. Preparar Ambiente

```bash
# Instalar Shopify CLI (se não tiver)
npm install -g @shopify/cli @shopify/theme

# Ou via Homebrew (macOS/Linux)
brew tap shopify/shopify
brew install shopify-cli
```

### 2. Conectar à Nova Loja

```bash
# Login na Shopify
shopify auth login

# Navegar até o diretório do tema
cd /path/to/new-store-theme
```

### 3. Baixar Tema de Desenvolvimento

```bash
# Listar temas disponíveis
shopify theme list

# Baixar tema específico (substitua THEME_ID pelo ID do tema)
shopify theme pull --theme=THEME_ID --development

# Ou criar um novo tema de desenvolvimento
shopify theme dev --store=sua-loja.myshopify.com
```

### 4. Copiar Arquivos Bazicash

```bash
# Do tema atual para o novo tema
# Substitua /path/to/new-theme pelo caminho do novo tema

# Copiar assets
cp assets/bazicash.css /path/to/new-theme/assets/
cp assets/bazicash.js /path/to/new-theme/assets/
cp assets/bazicash-icon.png /path/to/new-theme/assets/
cp assets/banner-bzh.png /path/to/new-theme/assets/

# Copiar sections
cp sections/floating-button.liquid /path/to/new-theme/sections/
cp sections/bazicash-page.liquid /path/to/new-theme/sections/
cp sections/bazicash-info-banner.liquid /path/to/new-theme/sections/

# Copiar snippets
cp snippets/bazicash-floating-button.liquid /path/to/new-theme/snippets/
cp snippets/bazicash-balance-section.liquid /path/to/new-theme/snippets/
cp snippets/bazicash-footer-link.liquid /path/to/new-theme/snippets/

# Copiar template
cp templates/page.bazicash.json /path/to/new-theme/templates/
```

### 5. Testar Localmente

```bash
# Iniciar servidor de desenvolvimento
cd /path/to/new-theme
shopify theme dev --store=sua-loja.myshopify.com

# O tema estará disponível em:
# https://sua-loja.myshopify.com?preview_theme_id=XXXXX
```

### 6. Configurar na Loja

Após subir os arquivos localmente:

1. **Criar página Bazicash:**
   - Admin Shopify → Online Store → Pages
   - Add page → Title: "Bazicash"
   - Template: `page.bazicash`

2. **Ativar Floating Button:**
   - Theme Customizer → Sections
   - Add Section → "Floating Button"

3. **Adicionar link no Footer (opcional):**
   - Theme Customizer → Footer
   - Verificar se há snippet `bazicash-footer-link.liquid` sendo usado

### 7. Verificar Integrações

```bash
# Verificar variáveis de ambiente no bazicash.js
# Atualizar endpoints da API se necessário:
# - URLs do servidor Bazicash
# - IDs da loja
# - Tokens de autenticação
```

**Arquivo a verificar:** `assets/bazicash.js`
- Confirme que as URLs da API estão corretas
- Atualize credenciais se necessário

## Modo de Desenvolvimento vs Produção

### Trabalhar APENAS localmente (sem subir para produção):

```bash
# Usar theme dev (não sobe alterações automaticamente)
shopify theme dev --store=sua-loja.myshopify.com --only

# Para subir manualmente quando quiser testar:
shopify theme push --development --unpublished
```

### Importante:
- **NÃO** use `shopify theme push` sem flags `--development` ou `--unpublished`
- **NÃO** use `shopify theme publish` para não afetar produção
- Sempre teste com `shopify theme dev` primeiro

## Comandos Úteis

```bash
# Ver diferenças entre local e remoto
shopify theme check

# Validar arquivos Liquid
shopify theme check --list

# Fazer backup do tema atual
shopify theme pull --theme=THEME_ID --path=backup-theme

# Compartilhar preview com outros
shopify theme share --theme=THEME_ID
```

## Checklist de Migração

- [ ] Todos os arquivos copiados
- [ ] Servidor local rodando (`shopify theme dev`)
- [ ] Página Bazicash criada no admin
- [ ] Floating button adicionado no customizer
- [ ] APIs e endpoints configurados corretamente
- [ ] Testado em ambiente de desenvolvimento
- [ ] Verificado responsividade mobile
- [ ] Testado funcionalidades do saldo e modal

## Troubleshooting

### Erro "Theme not found"
```bash
shopify theme list
# Use o ID correto do tema
```

### Arquivos não aparecem no tema
```bash
# Verificar se está no diretório correto
pwd

# Verificar estrutura de pastas
ls -la assets/ sections/ snippets/ templates/
```

### Mudanças não refletem
```bash
# Parar o servidor dev (Ctrl+C) e reiniciar
shopify theme dev --store=sua-loja.myshopify.com
```

## Notas Importantes

1. **Servidor Bazicash:** Se o sistema depende de um backend (pasta `server/`), certifique-se de que está rodando e acessível
2. **Credenciais:** Atualize tokens e IDs da loja no `bazicash.js`
3. **Theme App Extensions:** Caso use app blocks, migre também via `shopify app deploy`
4. **Metafields:** Se Bazicash usa metafields, configure-os na nova loja também

## Referências

- [Shopify CLI Themes](https://shopify.dev/docs/themes/tools/cli)
- [Theme Development Workflow](https://shopify.dev/docs/themes/tools/cli/commands#dev)
- Documentação interna: `BAZICASH-README.md`, `BAZICASH-STRUCTURE.md`

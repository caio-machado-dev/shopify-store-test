# 📊 Estrutura do Sistema BaziCash

## 🗂️ Arquitetura de Arquivos

### 📁 Assets (Recursos)
- **`assets/bazicash.css`** - Estilos completos com sistema de cores CSS variables
- **`assets/bazicash.js`** - Lógica JavaScript + integração API via Fetch
- **`assets/bazicash-icon.png`** - Ícone PNG 32x32 do BaziCash

### 📁 Sections (Seções Principais)
- **`sections/floating-button.liquid`** - Seção do botão flutuante (renderiza snippet)
- **`sections/bazicash-page.liquid`** - Página completa com todas as funcionalidades
- **`sections/bazicash-info-banner.liquid`** - Banner promocional personalizável (opcional)

### 📁 Snippets (Componentes Modulares)
- **`snippets/bazicash-floating-button.liquid`** - Link flutuante vertical com ícone
- **`snippets/bazicash-footer-link.liquid`** - Link estilizado para rodapé
- **`snippets/bazicash-balance-section.liquid`** - Exibe saldo + estatísticas (mockadas)
- **`snippets/bazicash-redeem-section.liquid`** - Formulário de resgate
- **`snippets/bazicash-history-section.liquid`** - Histórico com abas (placeholder)

### 📁 Templates (Templates de Página)
- **`templates/page.bazicash.json`** - Template JSON que usa bazicash-page.liquid

## 🔗 Fluxo de Renderização

```
┌─────────────────────────────────────┐
│  sections/floating-button.liquid    │
│  (Renderizado no tema)              │
└────────────┬────────────────────────┘
             │ renders
             ▼
┌─────────────────────────────────────┐
│ snippets/bazicash-floating-button   │
│ (Botão flutuante com link)          │
└────────────┬────────────────────────┘
             │ redireciona para
             ▼
┌─────────────────────────────────────┐
│  /pages/bazicash                    │
│  (Página dedicada)                  │
└────────────┬────────────────────────┘
             │ usa template
             ▼
┌─────────────────────────────────────┐
│  templates/page.bazicash.json       │
└────────────┬────────────────────────┘
             │ renderiza
             ▼
┌─────────────────────────────────────┐
│  sections/bazicash-page.liquid      │
└────────────┬────────────────────────┘
             │ renders 3 snippets:
             ├─► bazicash-balance-section
             ├─► bazicash-redeem-section
             └─► bazicash-history-section
```

## 📍 Onde o BaziCash Aparece

1. **Botão Flutuante** - Lateral direita, sempre visível (via section floating-button)
2. **Página Dedicada** - `/pages/bazicash` com template customizado
3. **Link no Footer** - Snippet adicionado manualmente ao footer
4. **Banner Promocional** - Section disponível para adicionar via editor (opcional)

## 🔧 Configurações Necessárias

### 1. Criar Página no Admin Shopify
```
Título: BaziCash
URL Handle: bazicash (automático)
Template: page.bazicash (selecionar no menu lateral direito)
```

### 2. Adicionar Botão Flutuante
- Via Editor: Adicionar section "BaziCash Cashback"
- Via Código: `{% section 'floating-button' %}` no theme.liquid

### 3. Configurar Metafield CPF
```
Namespace: custom
Key: cpf
Tipo: Single line text
Localização: Admin → Configurações → Metafields → Clientes
```

### 4. CSS e JS
- **CSS:** Carregado por `floating-button.liquid` e `bazicash-page.liquid`
- **JS:** Carregado assincronamente por `bazicash-page.liquid`
- **Configuração:** JavaScript recebe CPF via `window.bazicashCustomerCPF`

## ✅ Arquivos Removidos (Limpeza)

- ~~`sections/floating-button-modular.liquid`~~ - Versão antiga removida (git D)
- ~~`snippets/bazicash-modal.liquid`~~ - Modal removido (sistema usa página dedicada)
- ~~`FLOATING-BUTTON-DOCS.md`~~ - Documentação antiga removida (substituída por esta)

## 🎨 Sistema de Cores

```css
--bazicash-primary: #121212        /* Preto principal */
--bazicash-primary-dark: #000000   /* Preto puro */
--bazicash-primary-light: #333333  /* Cinza escuro */
--bazicash-secondary: #6b6b6b      /* Cinza médio */
--bazicash-white: #ffffff          /* Branco */
```

## 📝 Funcionalidades Implementadas

### ✅ Saldo
- Consulta via API GET `/apps/bazicash/balance?cpf=X`
- Exibição formatada (R$ XX,XX)
- Atualização do badge do botão flutuante
- Estatísticas mockadas (aguardando API): Total ganhos, Total resgatado, Economia

### ✅ Resgate
- Input numérico com placeholder
- Validações JavaScript:
  - Valor > 0
  - CPF configurado
  - Saldo suficiente (cache local)
- POST para `/apps/bazicash/withdraw`
- Feedback visual (sucesso/erro)
- Atualização automática do saldo após resgate

### 🚧 Histórico (Em Desenvolvimento)
- Abas implementadas: Todas, Ganhos, Resgates
- UI completa com animações
- Mostra placeholder: "Histórico em breve! 🚀"
- Aguardando endpoint `/apps/bazicash/history` da API

## 🔌 Integração Atual

### Objeto Global JavaScript
```javascript
const BaziCash = {
  API_BASE_URL: '/apps/bazicash',
  customerEmail: null,
  customerCPF: null,
  cachedBalance: null,
  cachedHistory: null,
  USE_MOCK_DATA: false
}
```

### Injeção de Dados do Shopify
```liquid
<!-- Em bazicash-page.liquid -->
window.bazicashCustomerEmail = '{{ customer.email }}';
window.bazicashCustomerCPF = '{{ customer.metafields.custom.cpf }}';
window.bazicashCustomerId = '{{ customer.id }}';
```

### API Endpoints
- **GET** `/apps/bazicash/balance?cpf=X` → Retorna saldo disponível
- **POST** `/apps/bazicash/withdraw` → Processa resgate e cria store credit
- **GET** `/apps/bazicash/history?cpf=X` → (Futuro) Retorna transações

## 📦 Tecnologias

### Frontend
- **JavaScript:** Vanilla (ES6+) - Sem frameworks
- **CSS:** Variáveis CSS (`:root`) + Flexbox/Grid
- **Liquid:** Template engine do Shopify
- **Fetch API:** Requisições HTTP assíncronas

### Backend (Externo)
- **Node.js + Express:** Servidor API
- **Shopify Admin API:** Criação de Store Credit
- **MongoDB/Postgres:** Armazenamento de saldos (sugestão)

### Compatibilidade
- ✅ Shopify Dawn theme
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive
- ✅ Liquid 2.0

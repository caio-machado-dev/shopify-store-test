# 💰 BaziCash - Sistema de Cashback para Shopify

> Sistema completo de cashback integrado ao Shopify com resgate via API e interface modular

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquitetura](#-arquitetura)
3. [Estrutura de Arquivos](#-estrutura-de-arquivos)
4. [Instalação](#-instalação)
5. [Configuração](#-configuração)
6. [Funcionalidades](#-funcionalidades)
7. [Personalização](#-personalização)
8. [API e Integração](#-api-e-integração)
9. [Troubleshooting](#-troubleshooting)

---

## 🎯 Visão Geral

O **BaziCash** é um sistema modular de cashback que oferece:

- ✅ **Página dedicada** (`/pages/bazicash`) com todas as funcionalidades
- ✅ **Botão flutuante** sempre visível na lateral direita
- ✅ **Banner informativo** configurável para promover o programa
- ✅ **Link no footer** presente em todas as páginas
- ✅ **Integração via API** (App Proxy) com backend Node.js
- ✅ **Resgate de cashback** com validações
- ✅ **Histórico de transações** (em desenvolvimento)
- ✅ **Design responsivo** (mobile e desktop)
- ✅ **Sistema de cores monocromático** (preto e branco)

### Componentes Principais

```
┌─────────────────────────────────────────────┐
│  1. Página Dedicada (/pages/bazicash)      │
│     - Saldo disponível                      │
│     - Resgate de cashback                   │
│     - Histórico de transações               │
├─────────────────────────────────────────────┤
│  2. Botão Flutuante (lateral direita)      │
│     - Sempre visível                        │
│     - Mostra saldo em tempo real            │
│     - Redireciona para página               │
├─────────────────────────────────────────────┤
│  3. Banner Informativo (home page)          │
│     - Promove o programa                    │
│     - Call-to-action                        │
│     - Personalizável                        │
├─────────────────────────────────────────────┤
│  4. Link no Footer (todas as páginas)       │
│     - Acesso discreto mas presente          │
│     - Mostra saldo para logados             │
└─────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura

### Fluxo de Dados

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Frontend   │       │   Shopify    │       │   Backend    │
│  (Liquid/JS) │──────►│  App Proxy   │──────►│   Node.js    │
│ bazicash.js  │ Fetch │  /apps/      │ HTTPS │  Express API │
└──────────────┘       │  bazicash/*  │       └──────────────┘
       │               └──────────────┘               │
       │                                              │
       │         ┌─────────────────────┐              │
       └────────►│  Metafield CPF      │◄─────────────┘
                 │  (custom.cpf)       │
                 └─────────────────────┘
```

### Estrutura Modular

```
BaziCash System
├── Templates
│   └── page.bazicash.json          (Template da página)
│
├── Sections
│   ├── bazicash-page.liquid        (Página principal)
│   ├── bazicash-info-banner.liquid (Banner home)
│   └── floating-button.liquid      (Botão flutuante)
│
├── Snippets
│   ├── bazicash-floating-button.liquid   (Botão lateral)
│   ├── bazicash-footer-link.liquid       (Link rodapé)
│   ├── bazicash-balance-section.liquid   (Exibe saldo)
│   ├── bazicash-redeem-section.liquid    (Resgate)
│   └── bazicash-history-section.liquid   (Histórico - em dev)
│
└── Assets
    ├── bazicash.css                (Estilos completos)
    ├── bazicash.js                 (Lógica + API calls)
    └── bazicash-icon.png           (Ícone do sistema)
```

---

## 📁 Estrutura de Arquivos

### Templates

```
templates/
└── page.bazicash.json              # Template customizado
```

**Uso:** Aplicado na página "BaziCash" via Admin

### Sections

```
sections/
├── bazicash-page.liquid            # Página completa com todas seções
├── bazicash-info-banner.liquid     # Banner promocional (opcional)
└── floating-button.liquid          # Botão flutuante (global)
```

**Configuração:**

- `bazicash-page.liquid`: Usado no template page.bazicash
- `bazicash-info-banner.liquid`: Adicionar na home via editor
- `floating-button.liquid`: Adicionar no theme.liquid

### Snippets

```
snippets/
├── bazicash-floating-button.liquid     # Visual do botão flutuante
├── bazicash-footer-link.liquid         # Link no footer
├── bazicash-balance-section.liquid     # Seção de saldo
├── bazicash-redeem-section.liquid      # Seção de resgate
└── bazicash-history-section.liquid     # Histórico de transações
```

**Uso:** Renderizados automaticamente pelas seções

### Assets

```
assets/
├── bazicash.css                    # Estilos completos
└── bazicash.js                     # JavaScript + integração API
```

**Funções principais em `bazicash.js`:**

- `BaziCash.callAPI()` - Requisições HTTP genéricas via Fetch
- `BaziCash.fetchBalance()` - Consulta saldo via GET /balance
- `BaziCash.withdrawBalance()` - Processa resgate via POST /withdraw
- `BaziCash.loadBalance()` - Atualiza UI com saldo
- `BaziCash.redeem()` - Valida e executa resgate
- `BaziCash.loadHistory()` - Carrega histórico (placeholder)
- `BaziCash.updateFloatingButtonBadge()` - Atualiza badge do botão

---

## 🚀 Instalação

### Passo 1: Upload dos Arquivos

Os arquivos já estão no tema. Se precisar fazer push:

```bash
# Push completo
shopify theme push

# Ou push seletivo
shopify theme push --only "templates/page.bazicash.json"
shopify theme push --only "sections/bazicash-page.liquid"
shopify theme push --only "snippets/bazicash-*.liquid"
shopify theme push --only "assets/bazicash.*"
```

### Passo 2: Criar a Página BaziCash

1. **Acesse:** https://admin.shopify.com/store/bazi-test/pages/new
2. **Configure:**
   - **Título:** `BaziCash`
   - **Conteúdo:** `Sistema de cashback - Resgate seus pontos!`
   - **Handle:** Deve ser automaticamente `bazicash`
3. **Template:**
   - Clique em **"Alterar template"**
   - Selecione **`page.bazicash`**
4. **Salvar**

### Passo 3: Adicionar Botão Flutuante

**Opção 1 - Via Editor de Temas (Recomendado):**
1. Acesse o **Editor de Temas** no Admin
2. Abra qualquer página (ex: Home)
3. Na barra lateral, clique em "Adicionar seção"
4. Selecione **"BaziCash Cashback"**
5. Salvar

**Opção 2 - Via Código:**
Edite o arquivo `layout/theme.liquid`:

```liquid
<!-- Antes de fechar </body> -->
{% section 'floating-button' %}
</body>
```

O botão aparecerá em todas as páginas do site.

### Passo 4: Adicionar Banner na Home (Opcional)

1. Acesse o **Editor de Temas**
2. Vá para a **Home page**
3. Clique em **"Adicionar seção"**
4. Selecione **"BaziCash Banner"**
5. Posicione onde preferir (recomendado: após banner principal)
6. **Salvar**

---

## ⚙️ Configuração

### 1. Configurar Metafield CPF ⚠️ OBRIGATÓRIO

O sistema **requer** o CPF do cliente em metafield para funcionar.

**Criar Metafield:**

1. Acesse: **Admin → Configurações → Metafields → Clientes**
2. Clique em **"Adicionar definição"**
3. Configure:
   - **Namespace e chave:** `custom.cpf`
   - **Nome:** `CPF`
   - **Tipo:** `Texto de linha única`
   - **Validação:** Apenas números, 11 dígitos (exemplo: `12345678900`)

**Preencher CPF dos Clientes:**

1. **Admin → Clientes → [Cliente específico]**
2. Role até a seção **Metafields**
3. Preencha o campo **CPF** com 11 dígitos
4. Salvar

**Como o CPF é usado:**
```liquid
<!-- No Liquid, é injetado no JavaScript -->
window.bazicashCustomerCPF = '{{ customer.metafields.custom.cpf }}';
```

### 2. Configurar App Proxy (Backend) ⚠️ OBRIGATÓRIO

Para integrar com o backend Node.js:

1. **Admin → Apps → [Sua App] → App extensions → App proxy**
2. **Configure:**
   - **Subpath prefix:** `apps`
   - **Subpath:** `bazicash`
   - **Proxy URL:** `https://seu-backend.com` (URL do servidor Node.js)

**Resultado das rotas:**

```
Frontend chama:     /apps/bazicash/balance
                           ↓
Backend recebe:     /balance

Frontend chama:     /apps/bazicash/withdraw
                           ↓
Backend recebe:     /withdraw
```

**Veja BAZICASH-API.md** para instruções completas de implementação do backend.

### 3. Configurar JavaScript

Edite `assets/bazicash.js` se necessário:

```javascript
const BaziCash = {
  API_BASE_URL: "/apps/bazicash", // URL da API
  USE_MOCK_DATA: false, // false em produção
  // ...
};
```

---

## 🎨 Funcionalidades

### 1. Página BaziCash (`/pages/bazicash`)

**Conteúdo:**

#### 💳 Saldo Disponível

- Mostra saldo atual do cliente
- Estatísticas: Total ganho, Total resgatado, Economia gerada
- Atualização em tempo real

#### 🎁 Resgate de Cashback

- Campo para digitar valor
- Validações:
  - Valor mínimo: R$ 10,00
  - Saldo suficiente
  - Valor válido
- Botão de resgate
- Feedback visual (sucesso/erro)

#### 📊 Histórico de Transações

- Abas: Todas, Ganhos, Resgates
- **Status:** Placeholder - aguardando endpoint de histórico da API
- Mostra mensagem: "Histórico em breve! 🚀"
- Funcionalidade completa será implementada quando API disponibilizar endpoint

**Acesso:**

- URL direta: `/pages/bazicash`
- Botão flutuante
- Banner na home
- Link no footer

### 2. Botão Flutuante

**Características:**

- Posição: Lateral direita, centralizado verticalmente
- Sempre visível durante scroll
- Mostra saldo em tempo real
- Animação de pulsação
- Redireciona para `/pages/bazicash` ao clicar

**Visual:**

```
         ┌───────┐
         │   💰  │
         │   B   │
         │   A   │
Lateral  │   Z   │
Direita  │   I   │
         │   C   │
         │   A   │
         │   S   │
         │   H   │
         └───────┘
```

**Nota:** O badge de saldo está oculto no CSS (`display: none`)

### 3. Banner Informativo (Home)

**Conteúdo:**

- Título personalizável
- Subtítulo
- Saldo do cliente (se logado)
- Call-to-action
- Lista de benefícios

**Personalizável via Editor:**

- Cores (fundo, texto, botão)
- Textos
- Espaçamentos
- Ativar/desativar benefícios

### 4. Link no Footer

**Localização:** Primeiro bloco de menu no footer

**Visual:**

- Ícone 💰
- Texto: "BaziCash - Programa de Cashback"
- Saldo (se logado) ou badge "NOVO"
- Hover animado

---

## 🎨 Personalização

### Cores do Sistema

Edite `assets/bazicash.css` (linhas 6-42):

```css
:root {
  /* Cores principais */
  --bazicash-primary: #121212; /* Preto principal */
  --bazicash-primary-dark: #000000; /* Preto puro */
  --bazicash-primary-light: #333333; /* Cinza escuro */

  /* Cores de status */
  --bazicash-success: #28a745;
  --bazicash-danger: #dc3545;
  --bazicash-warning: #ffc107;

  /* Gradientes */
  --bazicash-gradient-primary: linear-gradient(
    135deg,
    #121212 0%,
    #000000 100%
  );
}
```

**Temas Alternativos:**

**Dourado (Premium):**

```css
--bazicash-primary: #ffd700;
--bazicash-gradient-primary: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
```

**Verde (Dinheiro):**

```css
--bazicash-primary: #28a745;
--bazicash-gradient-primary: linear-gradient(135deg, #28a745 0%, #20c997 100%);
```

**Azul (Confiança):**

```css
--bazicash-primary: #0066cc;
--bazicash-gradient-primary: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
```

### Personalizar Banner

**Via Editor de Temas:**

1. Selecione a seção "BaziCash Banner"
2. Configure:
   - **Título**
   - **Subtítulo**
   - **Texto do botão**
   - **Cores** (fundo, texto, botão)
   - **Espaçamentos**

**Via Código:** Edite `sections/bazicash-info-banner.liquid`

### Personalizar Botão Flutuante

Edite `assets/bazicash.css` (linhas 44-118):

```css
.floating-button {
  top: 50%; /* Posição vertical */
  right: 0; /* Lateral direita */
  min-width: 60px; /* Largura */
  min-height: 140px; /* Altura */
  /* ... */
}
```

**Mudar posição para esquerda:**

```css
.floating-button {
  left: 0;
  right: auto;
  border-radius: 0 12px 12px 0;
}
```

---

## 🔌 API e Integração

### Endpoints Disponíveis

**1. GET /apps/bazicash/balance**

Consulta saldo do cliente.

```javascript
// Request
GET /apps/bazicash/balance?cpf=12345678900

// Response
{
  "cpf": "12345678900",
  "available_balance": 125.50,
  "currency": "BRL"
}
```

**2. POST /apps/bazicash/withdraw**

Resgata valor e cria store credit.

```javascript
// Request
POST /apps/bazicash/withdraw
{
  "cpf": "12345678900",
  "amount_bz": 50.00
}

// Response
{
  "success": true,
  "store_credit_id": "gid://shopify/StoreCreditAccount/123456",
  "new_balance": 75.50,
  "currency": "BRL"
}
```

### Documentação Completa da API

Veja **BAZICASH-API.md** para:

- Configuração do backend
- Implementação dos endpoints
- Tratamento de erros
- CORS e segurança
- Testes e validação

---

## 🧪 Testes

### Checklist de Verificação

**✅ Página BaziCash:**

- [ ] Acessível em `/pages/bazicash`
- [ ] Template `bazicash` aplicado
- [ ] Mostra todas as seções (saldo, resgate, histórico)
- [ ] Responsiva em mobile

**✅ Botão Flutuante:**

- [ ] Aparece em todas as páginas
- [ ] Mostra saldo correto
- [ ] Redireciona para `/pages/bazicash`
- [ ] Animação funciona

**✅ Banner (se adicionado):**

- [ ] Aparece na home
- [ ] Textos corretos
- [ ] CTA funciona
- [ ] Cores adequadas

**✅ Link Footer:**

- [ ] Aparece no primeiro menu
- [ ] Mostra saldo (se logado)
- [ ] Link correto

**✅ Funcionalidades:**

- [ ] Carrega saldo via API
- [ ] Resgate funciona
- [ ] Histórico carrega
- [ ] Erros tratados

### Teste Manual

1. **Acesse a loja:**

   - Local: http://127.0.0.1:9292
   - Preview: https://loja.myshopify.com?preview_theme_id=XXX

2. **Faça login** com cliente que tenha:

   - CPF cadastrado no metafield
   - Saldo de cashback

3. **Teste navegação:**

   - Clique no botão flutuante
   - Acesse via banner (se tiver)
   - Acesse via footer
   - URL direta `/pages/bazicash`

4. **Teste funcionalidades:**
   - Visualize saldo
   - Tente resgatar valor
   - Veja histórico
   - Teste validações (valor mínimo, saldo insuficiente)

---

## 🐛 Troubleshooting

### Página vazia ou mostra apenas texto

**Problema:** Template não aplicado

**Solução:**

1. Acesse Admin → Páginas → BaziCash
2. No lado direito, em "Template"
3. Clique em "Alterar template"
4. Selecione `page.bazicash`
5. Salve

### Template "bazicash" não aparece na lista

**Problema:** Arquivo não enviado ao Shopify

**Solução:**

```bash
shopify theme push --only "templates/page.bazicash.json" --only "sections/bazicash-page.liquid"
```

### Botão flutuante não aparece

**Problema:** Seção não adicionada ao theme.liquid

**Solução:**
Adicione em `layout/theme.liquid` antes de `</body>`:

```liquid
{% section 'floating-button' %}
```

### Erro "CPF não configurado"

**Problema:** Metafield não criado ou não preenchido

**Solução:**

1. Admin → Configurações → Metafields → Clientes
2. Criar `custom.cpf` (se não existe)
3. Admin → Clientes → [Cliente]
4. Preencher campo CPF

### Erro de CORS na API

**Problema:** Backend não configurado corretamente

**Solução:** Veja **BAZICASH-API.md** seção "Segurança e CORS"

### Saldo não atualiza

**Problema:** Erro na requisição API

**Solução:**

1. Abra console (F12)
2. Verifique erros
3. Teste endpoint diretamente:
   ```bash
   curl "https://loja.myshopify.com/apps/bazicash/balance?cpf=12345678900"
   ```

---

## 📚 Arquivos de Documentação

- **BAZICASH-README.md** (este arquivo) - Documentação geral
- **BAZICASH-API.md** - Integração com backend e API

---

## 🎯 Roadmap

### Implementado ✅

- [x] Página dedicada com todas funcionalidades
- [x] Botão flutuante com saldo em tempo real
- [x] Banner promocional personalizável
- [x] Link no footer
- [x] Integração via API
- [x] Resgate com Store Credit
- [x] Histórico de transações
- [x] Design responsivo

### Futuro 🚀

- [ ] Notificações push de saldo
- [ ] Níveis de cashback (bronze, prata, ouro)
- [ ] Resgate parcial automático
- [ ] Dashboard de métricas
- [ ] Integração com programa de pontos
- [ ] Gamificação

---

## 📞 Suporte

### Logs e Debug

**Console do navegador (F12):**

```javascript
// Ver configuração atual
console.log(BaziCash);

// Testar API manualmente
await callAPI("/balance?cpf=12345678900");
await callAPI("/withdraw", {
  method: "POST",
  body: JSON.stringify({ cpf: "12345678900", amount_bz: 50 }),
});
```

### Contato

- **Documentação:** Este arquivo e BAZICASH-API.md
- **Issues:** Reporte bugs via repositório
- **Suporte:** contato@bazi.com.br

---

**Versão:** 2.0
**Última atualização:** 03/10/2025
**Status:** ✅ Em Produção (Histórico em desenvolvimento)

---

## 📄 Licença

© 2025 BaziCash - Todos os direitos reservados

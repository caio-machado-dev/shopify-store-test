# 💰 BaziCash - Sistema de Cashback para Shopify

> Sistema completo de cashback com página dedicada, botão flutuante, banner promocional e integração via API

---

## 📚 Documentação

### Guias Principais

- **[BAZICASH-README.md](BAZICASH-README.md)** - 📖 Documentação completa do sistema

  - Visão geral e arquitetura
  - Instalação e configuração
  - Funcionalidades e personalização
  - Troubleshooting

- **[BAZICASH-API.md](BAZICASH-API.md)** - 🔌 Integração com Backend
  - Configuração do App Proxy
  - Endpoints da API
  - Implementação JavaScript
  - CORS e segurança
  - Testes e validação

---

## 🎯 Visão Geral

### Funcionalidades

✅ **Página Dedicada** (`/pages/bazicash`)

- Saldo disponível com estatísticas
- Resgate de cashback
- Histórico completo de transações

✅ **Botão Flutuante**

- Sempre visível na lateral direita
- Mostra saldo em tempo real
- Redireciona para página principal

✅ **Banner Promocional** (Home)

- Design moderno e personalizável
- Call-to-action destacado
- Mostra saldo do cliente

✅ **Link no Footer**

- Presente em todas as páginas
- Acesso discreto mas consistente

### Status do Projeto

| Componente         | Status           |
| ------------------ | ---------------- |
| Página BaziCash    | ✅ 100% Completo |
| Botão Flutuante    | ✅ 100% Completo |
| Banner Promocional | ✅ 100% Completo |
| Link Footer        | ✅ 100% Completo |
| Integração API     | ✅ 100% Completo |
| Design Responsivo  | ✅ 100% Completo |
| Documentação       | ✅ 100% Completo |

---

## 🚀 Quick Start

### 1. Inicie o Servidor de Desenvolvimento

```bash
shopify theme dev --store bazi-test.myshopify.com
```

**Acesse:** http://127.0.0.1:9292

### 2. Crie a Página BaziCash

1. Acesse: https://admin.shopify.com/store/bazi-test/pages/new
2. Título: `BaziCash`
3. Template: Selecione `bazicash`
4. Salve

### 3. Adicione o Botão Flutuante

Edite `layout/theme.liquid`:

```liquid
<!-- Antes de fechar </body> -->
{% section 'floating-button' %}
</body>
```

### 4. (Opcional) Adicione o Banner na Home

1. Editor de Temas → Home
2. Adicionar seção → "BaziCash Banner"
3. Personalize e salve

---

## 📁 Estrutura do Projeto

```
loja-teste-shopify/
├── templates/
│   └── page.bazicash.json              # Template customizado
│
├── sections/
│   ├── bazicash-page.liquid            # Página principal
│   ├── bazicash-info-banner.liquid     # Banner promocional
│   └── floating-button.liquid          # Botão flutuante
│
├── snippets/
│   ├── bazicash-floating-button.liquid
│   ├── bazicash-footer-link.liquid
│   ├── bazicash-balance-section.liquid
│   ├── bazicash-redeem-section.liquid
│   └── bazicash-history-section.liquid
│
├── assets/
│   ├── bazicash.css                    # Estilos (645 linhas)
│   └── bazicash.js                     # Lógica + API (422 linhas)
│
└── docs/
    ├── README.md                        # Este arquivo
    ├── BAZICASH-README.md              # Documentação completa
    └── BAZICASH-API.md                 # Integração com backend
```

---

## � Componentes

### 1. Página BaziCash (`/pages/bazicash`)

- Saldo disponível + estatísticas
- Formulário de resgate
- Histórico completo
- Design responsivo

### 2. Botão Flutuante

- Lateral direita, sempre visível
- Mostra saldo em tempo real
- Animação de pulsação
- Redireciona para página

### 3. Banner Promocional (Home)

- Design moderno com gradiente
- Personalizável via editor
- Call-to-action destacado
- Mostra saldo do cliente

### 4. Link no Footer

- Ícone + texto descritivo
- Mostra saldo ou badge "NOVO"
- Hover animado
- Sempre presente

---

## ⚙️ Configuração Necessária

### 1. Metafield CPF

```
Namespace: custom
Key: cpf
Tipo: Texto de linha única
```

### 2. App Proxy

```
Subpath prefix: apps
Subpath: bazicash
Proxy URL: https://seu-backend.com
```

### 3. Backend Endpoints

```
GET  /apps/bazicash/balance?cpf=XXX
POST /apps/bazicash/withdraw
```

**Detalhes:** Veja [BAZICASH-API.md](BAZICASH-API.md)

---

## 🧪 Testes

```bash
# Local
http://127.0.0.1:9292/pages/bazicash

# Preview
https://bazi-test.myshopify.com/pages/bazicash?preview_theme_id=XXX
```

**Checklist:**

- [ ] Página carrega todas as seções
- [ ] Botão flutuante aparece
- [ ] Banner na home (se adicionado)
- [ ] Link no footer
- [ ] Resgate funciona
- [ ] Responsivo em mobile

---

## 📞 Suporte

**Documentação:**

- [BAZICASH-README.md](BAZICASH-README.md) - Guia completo
- [BAZICASH-API.md](BAZICASH-API.md) - Integração backend

**Debug:**

```javascript
// Console do navegador (F12)
console.log(BaziCash);
```

---

## 📜 Licença

© 2025 BaziCash - Todos os direitos reservados

---

**Versão:** 2.1  
**Última atualização:** 02/10/2025

- Consulta de saldo via `GET /apps/bazicash/balance`
- Resgate via `POST /apps/bazicash/withdraw`
- Validação de CPF obrigatória
- Tratamento de erros completo

### ⏳ Em Desenvolvimento

- Histórico de transações (aguardando endpoint `/history`)
- Notificações de cashback ganho
- Compartilhamento em redes sociais

---

## 🔧 Configuração Rápida

### Passo 1: Backend (CORS)

Adicione no middleware Express:

```javascript
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
```

### Passo 2: Metafield CPF

**Shopify Admin → Configurações → Metafields → Customers:**

1. Criar metafield:

   - **Namespace:** `custom`
   - **Key:** `cpf`
   - **Type:** Single line text
   - **Name:** CPF do Cliente

2. Preencher em clientes de teste

### Passo 3: Adicionar ao Tema

A seção já está no tema. Para adicionar em outras páginas:

```liquid
{% section 'floating-button' %}
```

---

## 🧪 Como Testar

### 1. Verifique os Logs

Abra o Console (F12) e procure por:

```javascript
🚀 BaziCash inicializando...
📋 Cliente configurado: { cpf: '***', email: '...' }
✅ DOM carregado - Iniciando BaziCash
✅ Event listener adicionado ao botão flutuante
```

### 2. Teste o Botão

- Clique no botão flutuante (canto inferior direito)
- Modal deve abrir
- Saldo deve aparecer (ou mensagem de erro)

### 3. Teste o Resgate

- Digite um valor no campo "Valor para resgatar"
- Clique em "Resgatar Agora"
- Verifique resposta da API no console

---

## 🎨 Customização

### Cores e Tema

Edite `assets/bazicash.css` (linhas 1-30):

```css
:root {
  --bazicash-primary: #00ff88; /* Verde neon */
  --bazicash-secondary: #00cc6a;
  --bazicash-bg: #1a1a1a; /* Fundo escuro */
  --bazicash-card-bg: #2a2a2a;
  --bazicash-text: #ffffff;
  --bazicash-text-muted: #888888;
}
```

### Textos

Edite os snippets em `snippets/bazicash-*.liquid`

### Comportamento

Edite `assets/bazicash.js`

---

## 🐛 Troubleshooting

### Botão não aparece

- Verifique se a seção `floating-button` está ativa no tema
- Abra o console (F12) e procure por erros

### "CPF não configurado"

- Configure o metafield `custom.cpf` no Shopify Admin
- Preencha o CPF no perfil do cliente

### Erro de CORS

- Verifique se o backend tem headers CORS configurados
- Teste o endpoint manualmente com curl/Postman

### Saldo não carrega

- Verifique console: `📡 BaziCash API: GET /apps/bazicash/balance?cpf=...`
- Teste o endpoint: `curl https://sua-loja.myshopify.com/apps/bazicash/balance?cpf=123`
- Verifique se o App Proxy está configurado corretamente

---

## 📚 Documentação Adicional

| Documento                                      | Descrição                                  |
| ---------------------------------------------- | ------------------------------------------ |
| **[BAZICASH-BUTTON.md](./BAZICASH-BUTTON.md)** | Implementação detalhada do floating-button |
| **[BAZICASH-API.md](./BAZICASH-API.md)**       | Integração com API via Ajax/App Proxy      |

---

## 📊 Tecnologias

- **Shopify Liquid** - Templating
- **Vanilla JavaScript (ES6+)** - Lógica
- **CSS3** - Estilos e animações
- **Fetch API** - Requisições HTTP
- **App Proxy** - Comunicação com backend

---

## 📝 Changelog

### v1.0.0 (01/10/2025)

- ✅ Integração completa com API
- ✅ Remoção de dados mockados
- ✅ Suporte a CPF via metafield
- ✅ Documentação consolidada

### v0.9.0 (anterior)

- ✅ Front-end mockado
- ✅ Design completo
- ✅ Modal interativo

---

## 📄 Licença

**Proprietário:** Bazi  
**Uso:** Interno apenas

---

## 🤝 Contato

Para suporte ou dúvidas:

1. Consulte a documentação técnica
2. Verifique os logs no console (F12)
3. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** 01/10/2025  
**Versão:** 1.0.0

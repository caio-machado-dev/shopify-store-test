# 🔌 API BaziCash - Integração Backend via App Proxy

Documentação completa da integração do **BaziCash** com backend Node.js via **Shopify App Proxy** e **Fetch API**.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura App Proxy](#arquitetura-app-proxy)
3. [Configuração Backend](#configuração-backend)
4. [Endpoints da API](#endpoints-da-api)
5. [Implementação JavaScript](#implementação-javascript)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Segurança e CORS](#segurança-e-cors)
8. [Testes](#testes)

---

## 🎯 Visão Geral

### O que é App Proxy?

O **App Proxy** do Shopify permite que o tema faça requisições para o backend personalizado através de URLs como:

```
https://bazi-test.myshopify.com/apps/bazicash/balance
                                   ↓
https://seu-backend.com/api/balance
```

### Fluxo de Dados

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Shopify    │       │   Shopify    │       │   Backend    │
│    Theme     │──────►│  App Proxy   │──────►│   Express    │
│  (bazicash.js)│  Ajax │   /apps/*    │ HTTPS │  API Server  │
└──────────────┘       └──────────────┘       └──────────────┘
```

### Características

✅ **Requisições Fetch/AJAX assíncronas**
✅ **CORS necessário no backend**
✅ **Metafield CPF como identificador**
✅ **URLs proxy transparentes** (`/apps/bazicash/*`)
✅ **Suporte a GET e POST com JSON**
✅ **Store Credit nativo do Shopify** (via Admin API)

---

## 🏗️ Arquitetura App Proxy

### Configuração no Shopify

**Shopify Admin → Apps → (Sua App) → App extensions → App proxy**

| Campo              | Valor                     |
| ------------------ | ------------------------- |
| **Subpath prefix** | `apps`                    |
| **Subpath**        | `bazicash`                |
| **Proxy URL**      | `https://seu-backend.com` |

**Resultado da configuração:**

```
Frontend faz:       GET /apps/bazicash/balance?cpf=12345678900
                              ↓
App Proxy encaminha:  GET https://seu-backend.com/balance?cpf=12345678900
```

**URLs funcionais:**
- `/apps/bazicash/balance` → Backend `/balance`
- `/apps/bazicash/withdraw` → Backend `/withdraw`
- `/apps/bazicash/history` → Backend `/history` (futuro)

### Exemplos de Rotas

```javascript
// Frontend chama:
GET /apps/bazicash/balance?cpf=12345678900

// Backend recebe:
GET /balance?cpf=12345678900

// Frontend chama:
POST /apps/bazicash/withdraw
{ cpf: "12345678900", amount_bz: 50.0 }

// Backend recebe:
POST /withdraw
{ cpf: "12345678900", amount_bz: 50.0 }
```

---

## ⚙️ Configuração Backend

### 1. Express Server

**`server.js` (exemplo completo):**

```javascript
const express = require("express");
const cors = require("cors");
const app = express();

// ========================================
// MIDDLEWARE CORS (ESSENCIAL!)
// Sem isso, o navegador bloqueia as requisições
// ========================================
app.use((req, res, next) => {
  // Aceita requisições do Shopify
  const allowedOrigins = [
    "https://bazi-test.myshopify.com",
    "http://127.0.0.1:9292", // Dev server local
    "https://127.0.0.1:9292",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Responde OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Parse JSON
app.use(express.json());

// ========================================
// ENDPOINT: GET /balance
// ========================================
app.get("/balance", async (req, res) => {
  try {
    const { cpf } = req.query;

    // Validação
    if (!cpf) {
      return res.status(400).json({
        error: "CPF é obrigatório",
        code: "MISSING_CPF",
      });
    }

    // Consulta no banco (exemplo)
    const customer = await db.customers.findOne({ cpf });

    if (!customer) {
      return res.status(404).json({
        error: "Cliente não encontrado",
        code: "CUSTOMER_NOT_FOUND",
      });
    }

    // Resposta
    res.json({
      cpf: customer.cpf,
      available_balance: customer.balance || 0,
      currency: "BRL",
    });
  } catch (error) {
    console.error("❌ Erro ao buscar saldo:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      code: "INTERNAL_ERROR",
    });
  }
});

// ========================================
// ENDPOINT: POST /withdraw
// ========================================
app.post("/withdraw", async (req, res) => {
  try {
    const { cpf, amount_bz } = req.body;

    // Validações
    if (!cpf || !amount_bz) {
      return res.status(400).json({
        error: "CPF e amount_bz são obrigatórios",
        code: "MISSING_PARAMETERS",
      });
    }

    if (amount_bz < 10) {
      return res.status(400).json({
        error: "Valor mínimo é R$ 10,00",
        code: "AMOUNT_TOO_LOW",
      });
    }

    // Consulta saldo atual
    const customer = await db.customers.findOne({ cpf });

    if (!customer) {
      return res.status(404).json({
        error: "Cliente não encontrado",
        code: "CUSTOMER_NOT_FOUND",
      });
    }

    if (customer.balance < amount_bz) {
      return res.status(400).json({
        error: "Saldo insuficiente",
        code: "INSUFFICIENT_BALANCE",
        available_balance: customer.balance,
      });
    }

    // Cria store credit no Shopify via Admin API
    // Requer: Shopify App com Store Credit permissions
    const storeCredit = await shopify.rest.StoreCreditAccount.create({
      session: session,
      customer_id: customer.shopify_customer_id,
      initial_balance: {
        amount: amount_bz.toFixed(2),
        currency_code: "BRL",
      },
      note: `Resgate BaziCash - ${new Date().toISOString()}`,
    });

    // Atualiza saldo
    const newBalance = customer.balance - amount_bz;
    await db.customers.updateOne(
      { cpf },
      {
        $set: { balance: newBalance },
        $push: {
          transactions: {
            type: "withdraw",
            amount: amount_bz,
            date: new Date(),
            store_credit_id: storeCredit.id,
          },
        },
      }
    );

    // Resposta
    res.json({
      success: true,
      store_credit_id: storeCredit.id,
      new_balance: newBalance,
      currency: "BRL",
    });
  } catch (error) {
    console.error("❌ Erro ao processar resgate:", error);
    res.status(500).json({
      error: "Erro ao processar resgate",
      code: "WITHDRAW_ERROR",
    });
  }
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend BaziCash rodando na porta ${PORT}`);
});
```

---

## 📡 Endpoints da API

### **GET /apps/bazicash/balance**

Consulta o saldo disponível de um cliente.

#### Request

```http
GET /apps/bazicash/balance?cpf=12345678900 HTTP/1.1
Host: bazi-test.myshopify.com
```

#### Response (200 OK)

```json
{
  "cpf": "12345678900",
  "available_balance": 125.5,
  "currency": "BRL"
}
```

#### Códigos de Erro

| Status | Code                 | Mensagem                 |
| ------ | -------------------- | ------------------------ |
| `400`  | `MISSING_CPF`        | CPF é obrigatório        |
| `404`  | `CUSTOMER_NOT_FOUND` | Cliente não encontrado   |
| `500`  | `INTERNAL_ERROR`     | Erro interno do servidor |

---

### **POST /apps/bazicash/withdraw**

Resgata um valor do saldo e cria um store credit no Shopify.

#### Request

```http
POST /apps/bazicash/withdraw HTTP/1.1
Host: bazi-test.myshopify.com
Content-Type: application/json

{
  "cpf": "12345678900",
  "amount_bz": 50.00
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "store_credit_id": "gid://shopify/StoreCreditAccount/123456",
  "new_balance": 75.5,
  "currency": "BRL"
}
```

#### Códigos de Erro

| Status | Code                   | Mensagem                         |
| ------ | ---------------------- | -------------------------------- |
| `400`  | `MISSING_PARAMETERS`   | CPF e amount_bz são obrigatórios |
| `400`  | `AMOUNT_TOO_LOW`       | Valor mínimo é R$ 10,00          |
| `400`  | `INSUFFICIENT_BALANCE` | Saldo insuficiente               |
| `404`  | `CUSTOMER_NOT_FOUND`   | Cliente não encontrado           |
| `500`  | `WITHDRAW_ERROR`       | Erro ao processar resgate        |

---

## 💻 Implementação JavaScript

### Configuração (`assets/bazicash.js`)

**Objeto principal (linhas 9-23):**

```javascript
// ========================================
// CONFIGURAÇÃO DO BAZICASH
// ========================================
const BaziCash = {
  // URL base da API via App Proxy
  API_BASE_URL: '/apps/bazicash',

  // Dados do cliente (injetados pelo Liquid via window.bazicashCustomer*)
  customerEmail: null,
  customerCPF: null,

  // Cache local
  cachedBalance: null,
  cachedHistory: null,

  // Modo de desenvolvimento (usar mock ao invés de API real)
  USE_MOCK_DATA: false, // ⚠️ SEMPRE false em produção!
};
```

---

### Função Genérica de Requisição

**Função genérica de API (linhas 25-62):**

```javascript
/**
 * Faz requisições HTTP para a API BaziCash via App Proxy
 * @param {string} endpoint - 'balance' ou 'withdraw'
 * @param {object} options - Opções da requisição (method, body, etc)
 * @returns {Promise<Object>} { success, data } ou { success: false, error }
 */
async callAPI(endpoint, options = {}) {
  try {
    const url = `${this.API_BASE_URL}/${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const fetchOptions = { ...defaultOptions, ...options };

    console.log(`📡 BaziCash API: ${fetchOptions.method} ${url}`);

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);

    return { success: true, data };
  } catch (error) {
    console.error('❌ API Error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erro ao comunicar com o servidor. Tente novamente.'
    };
  }
}
```

---

### GET Balance (Consulta Saldo)

**Consulta de saldo (linhas 64-81):**

```javascript
/**
 * Busca o saldo do cliente
 * @returns {Promise<number>} Saldo disponível
 */
async fetchBalance() {
  if (!this.customerCPF) {
    console.warn('⚠️ CPF não configurado');
    return 0;
  }

  const result = await this.callAPI(`balance?cpf=${this.customerCPF}`);

  if (result.success && result.data) {
    return result.data.available_balance || 0;
  }

  return 0;
}
```

**Uso no código:**

```javascript
// Carrega saldo ao abrir o modal
async function loadBalance() {
  try {
    showLoading(true);

    const { balance, currency } = await fetchBalance();

    BaziCash.currentBalance = balance;

    // Atualiza UI
    const formatted = formatCurrency(balance);
    document.getElementById("bazicashBalanceDisplay").textContent = formatted;
    document.getElementById("bazicashRedeemBalance").textContent = formatted;

    console.log(`✅ Saldo carregado: ${formatted}`);
  } catch (error) {
    console.error("❌ Erro ao carregar saldo:", error);
    showError("Não foi possível carregar o saldo. Tente novamente.");
  } finally {
    showLoading(false);
  }
}
```

---

### POST Withdraw (Resgate)

**Resgate de cashback (linhas 83-105):**

```javascript
/**
 * Realiza saque/resgate
 * @param {number} amount - Valor a sacar
 * @returns {Promise<object>} Resultado da operação
 */
async withdrawBalance(amount) {
  if (!this.customerCPF) {
    return {
      success: false,
      message: 'CPF não configurado'
    };
  }

  const result = await this.callAPI('withdraw', {
    method: 'POST',
    body: JSON.stringify({
      cpf: this.customerCPF,
      amount_bz: amount
    })
  });

  return result;
}
```

**Uso no código:**

```javascript
// Processa formulário de resgate
async function redeem(event) {
  event.preventDefault();

  try {
    const amountInput = document.getElementById("bazicashRedeemAmount");
    const amount = parseFloat(amountInput.value);

    // Validações
    if (isNaN(amount) || amount <= 0) {
      return showError("Digite um valor válido");
    }

    if (amount < 10) {
      return showError("Valor mínimo é R$ 10,00");
    }

    if (amount > BaziCash.currentBalance) {
      return showError("Saldo insuficiente");
    }

    // Chama API
    setLoading(true, "Processando resgate...");

    const result = await withdrawBalance(amount);

    if (result.success) {
      // Atualiza saldo
      BaziCash.currentBalance = result.new_balance;

      // Mostra sucesso
      showSuccess(
        `✅ Resgate de ${formatCurrency(amount)} realizado com sucesso!`
      );

      // Limpa formulário
      amountInput.value = "";

      // Recarrega saldo
      await loadBalance();
    }
  } catch (error) {
    console.error("❌ Erro no resgate:", error);
    showError(error.message || "Falha ao processar resgate");
  } finally {
    setLoading(false);
  }
}
```

---

## 🛡️ Tratamento de Erros

### Hierarquia de Erros

```javascript
try {
  const data = await fetchBalance();
} catch (error) {
  // 1. Erros de Rede
  if (error instanceof TypeError) {
    console.error("❌ Erro de rede:", error);
    showError("Sem conexão com o servidor");
  }

  // 2. Erros da API (400, 404, 500)
  else if (error.message.includes("HTTP")) {
    console.error("❌ Erro HTTP:", error);
    showError("Erro ao processar requisição");
  }

  // 3. Erros de Validação
  else if (error.message === "CPF não configurado") {
    console.error("❌ CPF ausente");
    showError("Configure o CPF do cliente");
  }

  // 4. Outros erros
  else {
    console.error("❌ Erro desconhecido:", error);
    showError("Erro inesperado. Tente novamente.");
  }
}
```

### Códigos de Erro da API

```javascript
// Mapeia códigos de erro para mensagens amigáveis
const ERROR_MESSAGES = {
  MISSING_CPF: 'CPF não informado',
  CUSTOMER_NOT_FOUND: 'Cliente não encontrado no sistema',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente para este resgate',
  AMOUNT_TOO_LOW: 'Valor mínimo é R$ 10,00',
  MISSING_PARAMETERS: 'Dados incompletos',
  INTERNAL_ERROR: 'Erro no servidor. Tente novamente mais tarde',
  WITHDRAW_ERROR: 'Falha ao processar resgate'
};

// Uso:
catch (error) {
  const apiError = await response.json();
  const message = ERROR_MESSAGES[apiError.code] || apiError.error;
  showError(message);
}
```

### Feedback Visual

```javascript
/**
 * Exibe mensagem de erro no modal
 */
function showError(message) {
  const messageDiv = document.getElementById("bazicashRedeemMessage");
  messageDiv.className = "bazicash-message bazicash-message-error";
  messageDiv.textContent = message;
  messageDiv.style.display = "block";

  // Remove após 5 segundos
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}

/**
 * Exibe mensagem de sucesso
 */
function showSuccess(message) {
  const messageDiv = document.getElementById("bazicashRedeemMessage");
  messageDiv.className = "bazicash-message bazicash-message-success";
  messageDiv.textContent = message;
  messageDiv.style.display = "block";

  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}
```

---

## 🔒 Segurança e CORS

### O que é CORS?

**CORS (Cross-Origin Resource Sharing)** permite que o navegador faça requisições de um domínio (Shopify) para outro (seu backend).

### Configuração CORS Completa

**Backend Express:**

```javascript
app.use((req, res, next) => {
  // 1. Define origens permitidas
  const allowedOrigins = [
    "https://bazi-test.myshopify.com",
    "https://bazi-test.myshopify.com:9292", // Dev server
    "http://127.0.0.1:9292", // Local
  ];

  const origin = req.headers.origin;

  // 2. Valida origem
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    console.warn("⚠️ Origem não permitida:", origin);
  }

  // 3. Métodos HTTP permitidos
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  // 4. Headers permitidos
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 5. Permite enviar cookies/credenciais
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // 6. Cache da preflight (1 hora)
  res.setHeader("Access-Control-Max-Age", "3600");

  // 7. Responde OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});
```

### Preflight Request

Antes de fazer POST, o navegador envia **OPTIONS** (preflight):

```http
OPTIONS /apps/bazicash/withdraw HTTP/1.1
Host: bazi-test.myshopify.com
Origin: https://bazi-test.myshopify.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type
```

**Backend deve responder:**

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://bazi-test.myshopify.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: true
```

### Validação de CPF no Backend

```javascript
app.use((req, res, next) => {
  // Valida formato do CPF
  const cpf = req.query.cpf || req.body.cpf;

  if (cpf && !isValidCPF(cpf)) {
    return res.status(400).json({
      error: "CPF inválido",
      code: "INVALID_CPF",
    });
  }

  next();
});

function isValidCPF(cpf) {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false;

  // Valida dígitos verificadores
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}
```

---

## 🧪 Testes

### 1. Teste Manual com cURL

**GET Balance:**

```bash
curl -X GET "https://bazi-test.myshopify.com/apps/bazicash/balance?cpf=12345678900" \
  -H "Content-Type: application/json" \
  -v
```

**Resposta esperada:**

```json
{
  "cpf": "12345678900",
  "available_balance": 125.5,
  "currency": "BRL"
}
```

**POST Withdraw:**

```bash
curl -X POST "https://bazi-test.myshopify.com/apps/bazicash/withdraw" \
  -H "Content-Type: application/json" \
  -d '{
    "cpf": "12345678900",
    "amount_bz": 50.00
  }' \
  -v
```

**Resposta esperada:**

```json
{
  "success": true,
  "store_credit_id": "gid://shopify/StoreCreditAccount/123456",
  "new_balance": 75.5,
  "currency": "BRL"
}
```

---

### 2. Teste no Console do Navegador

Abra o console (F12) no Shopify:

```javascript
// Teste GET Balance
fetch("/apps/bazicash/balance?cpf=12345678900", {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
})
  .then((res) => res.json())
  .then((data) => console.log("✅ Saldo:", data))
  .catch((err) => console.error("❌ Erro:", err));

// Teste POST Withdraw
fetch("/apps/bazicash/withdraw", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    cpf: "12345678900",
    amount_bz: 50.0,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("✅ Resgate:", data))
  .catch((err) => console.error("❌ Erro:", err));
```

---

### 3. Checklist de Validação

#### ✅ **Backend CORS**

- [ ] Headers `Access-Control-Allow-*` configurados
- [ ] Responde `OPTIONS` com status 200
- [ ] Testa com cURL e retorna JSON
- [ ] Valida CPF no backend

#### ✅ **App Proxy**

- [ ] Configurado em Shopify Admin
- [ ] Subpath: `/apps/bazicash`
- [ ] Proxy URL aponta para backend
- [ ] Testa URL no navegador

#### ✅ **Frontend JavaScript**

- [ ] `callAPI()` implementada
- [ ] `fetchBalance()` funciona
- [ ] `withdrawBalance()` funciona
- [ ] Erros tratados e logados
- [ ] Loading exibido durante requisições

#### ✅ **Metafield CPF**

- [ ] Criado em Shopify Admin (`custom.cpf`)
- [ ] Preenchido em clientes de teste
- [ ] Injetado no Liquid (`window.bazicashCustomerCPF`)
- [ ] Lido pelo JavaScript

---

## 📊 Logs e Debug

### Logs do Frontend

Abra o console (F12) durante uso:

```javascript
// Inicialização
🚀 BaziCash inicializando...
📋 Cliente configurado: { cpf: '12345678900', email: 'teste@email.com' }

// DOM carregado
✅ DOM carregado - Iniciando BaziCash
✅ Event listener adicionado ao botão flutuante

// Requisições
📡 BaziCash API: GET /apps/bazicash/balance?cpf=12345678900
✅ Saldo recebido: { cpf: '...', available_balance: 125.5, currency: 'BRL' }
✅ Saldo carregado: R$ 125,50

// Resgate
📡 BaziCash API: POST /apps/bazicash/withdraw
✅ Resgate realizado: { success: true, store_credit_id: '...', new_balance: 75.5 }
```

### Logs do Backend

**Express console:**

```javascript
🚀 Backend BaziCash rodando na porta 3000

GET /balance?cpf=12345678900
✅ Saldo consultado: R$ 125,50

POST /withdraw
📝 Resgate: CPF=12345678900, Valor=50.00
✅ Store Credit criado: gid://shopify/StoreCreditAccount/123456
✅ Novo saldo: R$ 75,50
```

---

## 🐛 Troubleshooting

### ❌ **Erro: CORS policy**

**Console:**

```
Access to fetch at '...' has been blocked by CORS policy
```

**Solução:**

1. Verifique headers no backend:

   ```javascript
   res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
   res.setHeader("Access-Control-Allow-Credentials", "true");
   ```

2. Teste manualmente:

   ```bash
   curl -H "Origin: https://bazi-test.myshopify.com" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS \
        https://seu-backend.com/balance -v
   ```

3. Verifique resposta:
   ```
   < Access-Control-Allow-Origin: https://bazi-test.myshopify.com
   < Access-Control-Allow-Methods: GET, POST, OPTIONS
   ```

---

### ❌ **Erro: CPF não configurado**

**Console:**

```javascript
⚠️ CPF não configurado para o cliente
```

**Solução:**

1. Verifique metafield:

   ```liquid
   CPF: {{ customer.metafields.custom.cpf }}
   ```

2. Configure em: **Shopify Admin → Clientes → [Cliente] → Metafields**

3. Verifique JavaScript:
   ```javascript
   console.log("CPF:", window.bazicashCustomerCPF);
   // Deve mostrar: CPF: 12345678900
   ```

---

### ❌ **Erro: 404 Not Found**

**Possíveis causas:**

1. **App Proxy não configurado**

   - Shopify Admin → Apps → App Proxy
   - Verifique subpath: `/apps/bazicash`

2. **Rota não existe no backend**

   ```javascript
   // Verifique se tem:
   app.get('/balance', ...)
   app.post('/withdraw', ...)
   ```

3. **URL incorreta**

   ```javascript
   // Correto:
   /apps/bazicash/balance

   // Errado:
   /api/balance
   /bazicash/balance
   ```

---

### ❌ **Erro: Resposta não é JSON**

**Console:**

```javascript
❌ Resposta não é JSON
```

**Solução:**

Verifique `Content-Type` no backend:

```javascript
app.get('/balance', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ ... });
});
```

---

## 📚 Referências

- [Shopify App Proxy](https://shopify.dev/docs/apps/build/online-store/display-dynamic-data)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Express.js](https://expressjs.com/)

---

## 🔗 Próximos Passos

1. **Implemente o backend** conforme especificações
2. **Configure CORS** e teste com cURL
3. **Configure App Proxy** no Shopify Admin
4. **Teste no console** (F12) do navegador
5. **Monitore logs** durante testes reais

---

---

## 🔮 Endpoint Futuro: Histórico

### **GET /apps/bazicash/history** (Em desenvolvimento)

Retorna histórico de transações do cliente.

#### Request Futuro

```http
GET /apps/bazicash/history?cpf=12345678900&limit=50&type=all HTTP/1.1
Host: bazi-test.myshopify.com
```

**Query Parameters:**
- `cpf` (obrigatório): CPF do cliente
- `limit` (opcional): Número máximo de registros (padrão: 50)
- `type` (opcional): `all`, `ganhos`, `resgates` (padrão: `all`)

#### Response Esperado (200 OK)

```json
{
  "cpf": "12345678900",
  "transactions": [
    {
      "id": "txn_123456",
      "type": "ganho",
      "amount": 25.50,
      "description": "Cashback pedido #1234",
      "date": "2025-10-01T10:30:00Z",
      "order_id": "1234"
    },
    {
      "id": "txn_123457",
      "type": "resgate",
      "amount": -50.00,
      "description": "Resgate para crédito",
      "date": "2025-10-02T14:20:00Z",
      "store_credit_id": "gid://shopify/StoreCreditAccount/789"
    }
  ],
  "total_count": 2,
  "has_more": false
}
```

#### Implementação JavaScript (Placeholder Atual)

```javascript
// Linhas 248-270 em bazicash.js
loadHistory: async function(filterType = 'all') {
  const historyContainer = document.getElementById('bazicashHistory');

  if (!historyContainer) {
    console.error('Container do histórico não encontrado!');
    return;
  }

  // TODO: Implementar quando endpoint estiver disponível
  historyContainer.innerHTML = '<div class="bazicash-empty-history">Histórico em breve! 🚀</div>';

  /* Implementação futura:
  try {
    const response = await this.callAPI(`history?cpf=${this.customerCPF}&type=${filterType}`);
    if (response.success && response.data) {
      this.renderHistory(response.data.transactions);
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
  */
}
```

---

**Última atualização:** 03/10/2025
**Versão:** 2.0
**Status:** ✅ Documentação completa e atualizada

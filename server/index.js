import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// ============================================================================
// SHOPIFY API CONFIGURATION
// ============================================================================

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_customers', 'write_customers', 'read_orders', 'write_orders', 'read_store_credit_accounts', 'write_store_credit_account_transactions', 'read_store_credit_account_transactions'],
  hostName: process.env.SHOPIFY_STORE_DOMAIN,
  apiVersion: process.env.SHOPIFY_API_VERSION || LATEST_API_VERSION,
  isEmbeddedApp: false,
  isCustomStoreApp: true,
  adminApiAccessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

// Criar sessão para Custom App
const createSession = () => {
  return shopify.session.customAppSession(process.env.SHOPIFY_STORE_DOMAIN);
};

// ============================================================================
// EXPRESS APP SETUP
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Busca customer ID pelo email
 */
async function getCustomerIdByEmail(session, email) {
  const client = new shopify.clients.Graphql({ session });

  const query = `
    query getCustomer($email: String!) {
      customers(first: 1, query: $email) {
        edges {
          node {
            id
            email
            displayName
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query, {
      variables: { email: `email:${email}` }
    });

    const customers = response.data?.customers?.edges;
    if (customers && customers.length > 0) {
      return customers[0].node;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar customer:', error);
    throw error;
  }
}

/**
 * Busca saldo de Store Credit do customer
 */
async function getStoreCreditBalance(session, customerId) {
  const client = new shopify.clients.Graphql({ session });

  const query = `
    query getStoreCredit($customerId: ID!) {
      customer(id: $customerId) {
        id
        email
        storeCreditAccounts {
          balance {
            amount
            currencyCode
          }
          id
        }
      }
    }
  `;

  try {
    const response = await client.request(query, {
      variables: { customerId }
    });

    const customer = response.data?.customer;
    if (customer && customer.storeCreditAccounts) {
      const account = customer.storeCreditAccounts[0];
      return {
        balance: parseFloat(account?.balance?.amount || 0),
        currency: account?.balance?.currencyCode || 'BRL',
        accountId: account?.id
      };
    }

    return { balance: 0, currency: 'BRL', accountId: null };
  } catch (error) {
    console.error('Erro ao buscar store credit:', error);
    throw error;
  }
}

/**
 * Busca histórico de transações de Store Credit
 */
async function getStoreCreditHistory(session, customerId) {
  const client = new shopify.clients.Graphql({ session });

  const query = `
    query getStoreCreditHistory($customerId: ID!) {
      customer(id: $customerId) {
        id
        storeCreditAccounts {
          transactions(first: 50) {
            edges {
              node {
                id
                amount {
                  amount
                  currencyCode
                }
                createdAt
                ... on StoreCreditAccountDebitRevertTransaction {
                  creditTransaction {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await client.request(query, {
      variables: { customerId }
    });

    const customer = response.data?.customer;
    if (customer && customer.storeCreditAccounts && customer.storeCreditAccounts[0]) {
      const transactions = customer.storeCreditAccounts[0].transactions.edges;

      return transactions.map((edge, index) => {
        const node = edge.node;
        const amount = parseFloat(node.amount.amount);
        const isCredit = amount > 0;

        return {
          id: index + 1,
          type: isCredit ? 'ganho' : 'resgate',
          amount: Math.abs(amount),
          description: isCredit
            ? `Crédito adicionado - ID: ${node.id.split('/').pop()}`
            : `Resgate utilizado - ID: ${node.id.split('/').pop()}`,
          date: new Date(node.createdAt).toISOString().split('T')[0],
          timestamp: node.createdAt
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    throw error;
  }
}

/**
 * Cria transação de débito (resgate) de Store Credit
 */
async function debitStoreCredit(session, accountId, amount) {
  const client = new shopify.clients.Graphql({ session });

  // Nota: A API atual (2024-07) não possui mutation para débito direto
  // Isso deve ser feito através do checkout quando o customer usa o crédito
  // Este é um placeholder para quando a API suportar débitos manuais

  throw new Error('Débito manual de Store Credit não suportado pela API atual. Use o checkout do Shopify.');
}

// ============================================================================
// APP PROXY MIDDLEWARE
// ============================================================================

/**
 * Middleware para validar requisições do App Proxy
 * Valida o HMAC signature enviado automaticamente pelo Shopify
 *
 * O Shopify adiciona automaticamente estes parâmetros:
 * - signature: HMAC SHA256 para validação
 * - shop: Domínio da loja (ex: sua-loja.myshopify.com)
 * - timestamp: Unix timestamp da requisição
 * - logged_in_customer_id: ID do customer logado (se disponível)
 * - path_prefix: Prefix do path (ex: /apps/bazicash)
 */
async function validateAppProxy(req, res, next) {
  try {
    const isValid = await shopify.utils.validateHmac(req.query, {
      signator: 'appProxy',
    });

    if (!isValid) {
      console.error('❌ Invalid App Proxy HMAC signature');
      console.error('Query params:', req.query);
      return res.status(401).json({
        success: false,
        message: 'Requisição não autorizada - HMAC inválido'
      });
    }

    console.log('✅ App Proxy HMAC validated successfully');
    next();
  } catch (error) {
    console.error('❌ Erro ao validar App Proxy:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao validar requisição',
      error: error.message
    });
  }
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /apps/bazicash/balance
 * Retorna saldo de Store Credit do customer
 */
app.get('/apps/bazicash/balance', validateAppProxy, async (req, res) => {
  try {
    const { customer_email } = req.query;

    if (!customer_email) {
      return res.status(400).json({
        success: false,
        message: 'Email do customer é obrigatório'
      });
    }

    const session = createSession();

    // Buscar customer pelo email
    const customer = await getCustomerIdByEmail(session, customer_email);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer não encontrado'
      });
    }

    // Buscar saldo de Store Credit
    const creditInfo = await getStoreCreditBalance(session, customer.id);

    res.json({
      success: true,
      balance: creditInfo.balance,
      currency: creditInfo.currency,
      accountId: creditInfo.accountId,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.displayName
      }
    });
  } catch (error) {
    console.error('Erro em /proxy/balance:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar saldo',
      error: error.message
    });
  }
});

/**
 * GET /proxy/history
 * Retorna o histórico de transações de Store Credit
 *
 * Acessível via: https://sua-loja.myshopify.com/apps/bazicash/history
 */
app.get('/proxy/history', validateAppProxy, async (req, res) => {
  try {
    const { customer_email } = req.query;

    if (!customer_email) {
      return res.status(400).json({
        success: false,
        message: 'Email do customer é obrigatório'
      });
    }

    const session = createSession();

    // Buscar customer pelo email
    const customer = await getCustomerIdByEmail(session, customer_email);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer não encontrado'
      });
    }

    // Buscar histórico
    const history = await getStoreCreditHistory(session, customer.id);

    res.json({
      success: true,
      history: history
    });
  } catch (error) {
    console.error('Erro em /proxy/history:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
      error: error.message
    });
  }
});

/**
 * POST /proxy/redeem
 * Cria uma transação de débito (resgate) de Store Credit
 *
 * NOTA: A API atual do Shopify (2024-07) não suporta débitos manuais.
 * O resgate de Store Credit é feito automaticamente no checkout.
 *
 * Acessível via: https://sua-loja.myshopify.com/apps/bazicash/redeem
 */
app.post('/proxy/redeem', validateAppProxy, async (req, res) => {
  try {
    const { customer_email, amount } = req.body;

    if (!customer_email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Email e valor são obrigatórios'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor deve ser maior que zero'
      });
    }

    // IMPORTANTE: Store Credit débito é feito automaticamente no checkout
    // Não há API para débitos manuais na versão 2024-07
    res.status(501).json({
      success: false,
      message: 'Resgate manual não suportado. O Store Credit é usado automaticamente no checkout do Shopify.',
      info: 'Para usar o crédito, o cliente deve fazer uma compra e selecionar Store Credit como forma de pagamento.'
    });

  } catch (error) {
    console.error('Erro em /proxy/redeem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar resgate',
      error: error.message
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    shopify: {
      store: process.env.SHOPIFY_STORE_DOMAIN,
      apiVersion: process.env.SHOPIFY_API_VERSION
    }
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BaziCash Shopify App Backend');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  🚀 Server running on port ${PORT}`);
  console.log(`  🏪 Shopify Store: ${process.env.SHOPIFY_STORE_DOMAIN}`);
  console.log(`  📦 API Version: ${process.env.SHOPIFY_API_VERSION}`);
  console.log('');
  console.log('  📍 App Proxy Endpoints (via Shopify):');
  console.log(`     https://sua-loja.myshopify.com/apps/bazicash/balance`);
  console.log(`     https://sua-loja.myshopify.com/apps/bazicash/history`);
  console.log(`     https://sua-loja.myshopify.com/apps/bazicash/redeem`);
  console.log('');
  console.log('  🔧 Backend Routes:');
  console.log(`     GET  /proxy/balance?customer_email=email`);
  console.log(`     GET  /proxy/history?customer_email=email`);
  console.log(`     POST /proxy/redeem`);
  console.log(`     GET  /health`);
  console.log('');
  console.log('  ✅ App Proxy HMAC validation enabled');
  console.log('═══════════════════════════════════════════════════════════');
});
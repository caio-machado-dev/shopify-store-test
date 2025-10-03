import 'dotenv/config';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// ============================================================================
// CONFIGURAÇÃO SHOPIFY API
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

// Criar sessão
const session = shopify.session.customAppSession(process.env.SHOPIFY_STORE_DOMAIN);

// ============================================================================
// TESTE: BUSCAR CUSTOMER POR EMAIL
// ============================================================================

async function testGetCustomer(email) {
  console.log('\n📧 Buscando customer por email:', email);
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new shopify.clients.Graphql({ session });

  const query = `
    query getCustomer($email: String!) {
      customers(first: 1, query: $email) {
        edges {
          node {
            id
            email
            displayName
            firstName
            lastName
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
      const customer = customers[0].node;
      console.log('✅ Customer encontrado:');
      console.log('   ID:', customer.id);
      console.log('   Email:', customer.email);
      console.log('   Nome:', customer.displayName);
      return customer;
    } else {
      console.log('❌ Customer não encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar customer:', error.message);
    if (error.response) {
      console.error('Resposta:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

// ============================================================================
// TESTE: BUSCAR STORE CREDIT
// ============================================================================

async function testGetStoreCredit(customerId) {
  console.log('\n💰 Buscando Store Credit do customer:', customerId);
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new shopify.clients.Graphql({ session });

  const query = `
    query getStoreCredit($customerId: ID!) {
      customer(id: $customerId) {
        id
        email
        displayName
        storeCreditAccounts(first: 10) {
          edges {
            node {
              id
              balance {
                amount
                currencyCode
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

    if (customer) {
      console.log('✅ Dados do customer:');
      console.log('   ID:', customer.id);
      console.log('   Email:', customer.email);
      console.log('   Nome:', customer.displayName);
      console.log('');

      const accounts = customer.storeCreditAccounts?.edges || [];

      if (accounts.length > 0) {
        console.log('✅ Store Credit encontrado:');
        accounts.forEach((edge, index) => {
          const account = edge.node;
          console.log(`   Account ${index + 1}:`);
          console.log(`      ID: ${account.id}`);
          console.log(`      Saldo: ${account.balance.currencyCode} ${account.balance.amount}`);
        });
        return accounts[0].node;
      } else {
        console.log('⚠️  Customer não possui Store Credit Account');
        return null;
      }
    } else {
      console.log('❌ Customer não encontrado');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar Store Credit:', error.message);
    if (error.response) {
      console.error('Resposta:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

// ============================================================================
// TESTE: BUSCAR HISTÓRICO DE TRANSAÇÕES
// ============================================================================

async function testGetHistory(customerId) {
  console.log('\n📜 Buscando histórico de transações:', customerId);
  console.log('═══════════════════════════════════════════════════════════\n');

  const client = new shopify.clients.Graphql({ session });

  const query = `
    query getStoreCreditHistory($customerId: ID!) {
      customer(id: $customerId) {
        id
        storeCreditAccounts(first: 10) {
          edges {
            node {
              id
              transactions(first: 20) {
                edges {
                  node {
                    id
                    amount {
                      amount
                      currencyCode
                    }
                    createdAt
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
    const accounts = customer?.storeCreditAccounts?.edges || [];

    if (accounts.length > 0 && accounts[0].node) {
      const transactions = accounts[0].node.transactions.edges;

      if (transactions.length > 0) {
        console.log(`✅ ${transactions.length} transações encontradas:\n`);
        transactions.forEach((edge, index) => {
          const t = edge.node;
          const amount = parseFloat(t.amount.amount);
          const type = amount > 0 ? '📈 CRÉDITO' : '📉 DÉBITO';
          console.log(`   ${index + 1}. ${type}`);
          console.log(`      Valor: ${t.amount.currencyCode} ${Math.abs(amount)}`);
          console.log(`      Data: ${new Date(t.createdAt).toLocaleString('pt-BR')}`);
          console.log(`      ID: ${t.id.split('/').pop()}`);
          console.log('');
        });
        return transactions;
      } else {
        console.log('⚠️  Nenhuma transação encontrada');
        return [];
      }
    } else {
      console.log('❌ Customer não possui Store Credit Account');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error.message);
    if (error.response) {
      console.error('Resposta:', JSON.stringify(error.response, null, 2));
    }
    return null;
  }
}

// ============================================================================
// EXECUTAR TESTES
// ============================================================================

async function runTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   TESTE DE INTEGRAÇÃO SHOPIFY STORE CREDIT API           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🏪 Loja:', process.env.SHOPIFY_STORE_DOMAIN);
  console.log('📦 API Version:', process.env.SHOPIFY_API_VERSION);

  // Email para testar (pode passar via argumento)
  const testEmail = process.argv[2] || 'caio.machado.dev@gmail.com';

  try {
    // 1. Buscar customer por email
    const customer = await testGetCustomer(testEmail);

    if (!customer) {
      console.log('\n❌ Teste interrompido: Customer não encontrado');
      process.exit(1);
    }

    // 2. Buscar Store Credit
    const storeCredit = await testGetStoreCredit(customer.id);

    // 3. Buscar histórico de transações
    if (storeCredit) {
      await testGetHistory(customer.id);
    }

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║   ✅ TESTE CONCLUÍDO COM SUCESSO                         ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar
runTests();

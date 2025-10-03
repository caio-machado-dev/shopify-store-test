import 'dotenv/config';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

// ============================================================================
// CONFIGURAÇÃO DO APP PROXY VIA API
// ============================================================================

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_customers', 'write_store_credit_account_transactions', 'read_store_credit_account_transactions', 'write_app_proxy', 'read_app_proxy'],
  hostName: process.env.SHOPIFY_STORE_DOMAIN,
  apiVersion: process.env.SHOPIFY_API_VERSION || LATEST_API_VERSION,
  isEmbeddedApp: false,
  isCustomStoreApp: true,
  adminApiAccessToken: process.env.SHOPIFY_ACCESS_TOKEN,
});

const session = shopify.session.customAppSession(process.env.SHOPIFY_STORE_DOMAIN);

// ============================================================================
// CONFIGURAR APP PROXY
// ============================================================================

async function setupAppProxy() {
  const client = new shopify.clients.Graphql({ session });

  // URL do backend (ajuste conforme necessário)
  const proxyUrl = process.env.BACKEND_URL || 'https://SEU-BACKEND.com';

  console.log('🔧 Configurando App Proxy...');
  console.log(`📍 Proxy URL: ${proxyUrl}/proxy`);
  console.log(`📍 Subpath: /apps/bazicash`);
  console.log('');

  // Mutation para configurar App Proxy
  const mutation = `
    mutation appProxySet($input: AppProxySetInput!) {
      appProxySet(input: $input) {
        appProxy {
          url
          subPath
          subPathPrefix
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await client.request(mutation, {
      variables: {
        input: {
          url: `${proxyUrl}/proxy`,
          subPath: 'bazicash',
          subPathPrefix: 'apps'
        }
      }
    });

    if (response.data?.appProxySet?.userErrors?.length > 0) {
      console.error('❌ Erro ao configurar App Proxy:');
      response.data.appProxySet.userErrors.forEach(error => {
        console.error(`   - ${error.field}: ${error.message}`);
      });
      process.exit(1);
    }

    console.log('✅ App Proxy configurado com sucesso!');
    console.log('');
    console.log('Configuração:');
    console.log(`   URL: ${response.data.appProxySet.appProxy.url}`);
    console.log(`   Subpath: /${response.data.appProxySet.appProxy.subPathPrefix}/${response.data.appProxySet.appProxy.subPath}`);
    console.log('');
    console.log('🌐 Seus endpoints agora estão disponíveis em:');
    console.log(`   https://${process.env.SHOPIFY_STORE_DOMAIN}/apps/bazicash/balance`);
    console.log(`   https://${process.env.SHOPIFY_STORE_DOMAIN}/apps/bazicash/history`);
    console.log(`   https://${process.env.SHOPIFY_STORE_DOMAIN}/apps/bazicash/redeem`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao executar mutation:', error);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2));
    }
    process.exit(1);
  }
}

// ============================================================================
// VERIFICAR APP PROXY ATUAL
// ============================================================================

async function checkAppProxy() {
  const client = new shopify.clients.Graphql({ session });

  const query = `
    query {
      app {
        proxy {
          url
          subPath
          subPathPrefix
        }
      }
    }
  `;

  try {
    const response = await client.request(query);

    if (response.data?.app?.proxy) {
      console.log('📋 Configuração atual do App Proxy:');
      console.log(`   URL: ${response.data.app.proxy.url}`);
      console.log(`   Subpath: /${response.data.app.proxy.subPathPrefix}/${response.data.app.proxy.subPath}`);
      console.log('');
      return response.data.app.proxy;
    } else {
      console.log('⚠️  App Proxy ainda não configurado');
      console.log('');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar App Proxy:', error.message);
    return null;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  BaziCash - Configuração de App Proxy');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Verificar configuração atual
  const currentConfig = await checkAppProxy();

  // Perguntar se quer reconfigurar
  if (currentConfig) {
    console.log('⚠️  Já existe uma configuração de App Proxy.');
    console.log('   Deseja sobrescrever? (Ctrl+C para cancelar)');
    console.log('');

    // Aguardar 5 segundos antes de continuar
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Configurar App Proxy
  await setupAppProxy();

  console.log('✅ Processo concluído!');
  console.log('');
  console.log('📝 Próximos passos:');
  console.log('   1. Faça deploy do backend para uma URL pública');
  console.log('   2. Execute este script novamente com BACKEND_URL configurado:');
  console.log('      BACKEND_URL=https://seu-backend.com npm run setup-proxy');
  console.log('   3. Teste os endpoints através da loja Shopify');
  console.log('');
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

/**
 * ==========================================
 * BAZICASH - Sistema de Cashback
 * Integrado com API via App Proxy
 * ==========================================
 */

// === CONFIGURAÇÃO ===
const BaziCash = {
  // Configuração da API
  API_BASE_URL: '/apps/bazicash',
  
  // Variáveis globais
  customerEmail: null,
  customerCPF: null, // CPF do cliente (obrigatório para API)

  // Cache de dados
  cachedBalance: null,
  cachedHistory: null,
  
  // Flag para modo de desenvolvimento (fallback para mock)
  USE_MOCK_DATA: true, // Defina como true para usar dados mockados

  // === FUNÇÕES DE API ===
  /**
   * Faz chamada para a API do BaziCash via App Proxy
   * @param {string} endpoint - 'balance' ou 'withdraw'
   * @param {object} options - Opções da requisição (method, body, etc)
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
  },

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
  },

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
  },

  // === FUNÇÕES DE MODAL ===
  openModal: function() {
    document.getElementById('bazicashModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Previne scroll da página

    // Carregar saldo (mockado por enquanto, depois será do SDK)
    this.loadBalance();

    // Usar event delegation para as abas (mais robusto)
    setTimeout(() => {
      const modalBody = document.querySelector('.bazicash-modal-body');
      if (modalBody) {
        // Remove listener anterior se existir
        modalBody.removeEventListener('click', this.handleTabClick);
        // Adiciona novo listener
        modalBody.addEventListener('click', this.handleTabClick);
      }
    }, 100);
  },

  closeModal: function() {
    document.getElementById('bazicashModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaura scroll da página
    this.clearMessage();
  },

  // === FUNÇÕES DE MENSAGEM ===
  showMessage: function(message, type) {
    const messageElement = document.getElementById('bazicashMessage');
    messageElement.textContent = message;
    messageElement.className = `bazicash-message ${type}`;
    messageElement.style.display = 'block';

    // Auto hide depois de 5 segundos
    setTimeout(() => this.clearMessage(), 5000);
  },

  clearMessage: function() {
    const messageElement = document.getElementById('bazicashMessage');
    messageElement.style.display = 'none';
    messageElement.className = 'bazicash-message';
  },

  // === FUNÇÕES DE AUTENTICAÇÃO ===
  getCustomerEmail: function() {
    // Esta função será populada pelo Liquid template
    return window.bazicashCustomerEmail || null;
  },

  // === FUNÇÕES DE SALDO ===

  // === FUNÇÕES DE SALDO ===
  loadBalance: async function() {
    const balanceElement = document.getElementById('bazicashBalance');

    if (!this.customerCPF) {
      balanceElement.textContent = 'CPF não configurado';
      this.updateFloatingButtonBadge(0);
      this.showMessage('Configure seu CPF para acessar o BaziCash', 'warning');
      return;
    }

    try {
      balanceElement.textContent = 'Carregando...';

      // Buscar saldo da API
      const balance = await this.fetchBalance();
      this.cachedBalance = balance;

      // Atualizar UI (convertendo para inteiro, pois 1 real = 1 BaziCash)
      const bazicashAmount = Math.round(balance);
      balanceElement.textContent = `${bazicashAmount} BaziCash`;
      this.updateFloatingButtonBadge(bazicashAmount);

      console.log('✅ Saldo carregado:', balance);

    } catch (error) {
      console.error('❌ Erro ao carregar saldo:', error);
      balanceElement.textContent = 'Erro ao carregar';
      this.showMessage('Erro ao carregar saldo. Tente novamente.', 'error');
    }
  },

  updateFloatingButtonBadge: function(balance) {
    const badgeElement = document.getElementById('floatingButtonBadge');
    if (badgeElement) {
      const bazicashAmount = Math.round(balance);
      badgeElement.textContent = `${bazicashAmount} BZ`;

      // Adicionar animação de atualização
      badgeElement.style.transform = 'scale(1.2)';
      setTimeout(() => {
        badgeElement.style.transform = 'scale(1)';
      }, 200);
    }
  },

  // === FUNÇÕES DE ESTATÍSTICAS ===
  updateStats: function(history) {
    if (!history || history.length === 0) {
      // Sem histórico, zerar estatísticas
      const totalGanhosEl = document.getElementById('totalGanhos');
      const totalResgatesEl = document.getElementById('totalResgates');
      const economiaGeradaEl = document.getElementById('economiaGerada');
      
      if (totalGanhosEl) totalGanhosEl.textContent = 'R$ 0,00';
      if (totalResgatesEl) totalResgatesEl.textContent = 'R$ 0,00';
      if (economiaGeradaEl) economiaGeradaEl.textContent = '0%';
      return;
    }

    // Calcular totais
    let totalGanhos = 0;
    let totalResgates = 0;

    history.forEach(item => {
      if (item.type === 'ganho') {
        totalGanhos += item.amount;
      } else if (item.type === 'resgate') {
        totalResgates += Math.abs(item.amount);
      }
    });

    // Calcular economia gerada (porcentagem de cashback efetivo)
    const economiaPercentual = totalGanhos > 0 ? ((totalGanhos - totalResgates) / totalGanhos * 100) : 0;

    // Atualizar elementos
    const totalGanhosElement = document.getElementById('totalGanhos');
    const totalResgatesElement = document.getElementById('totalResgates');
    const economiaElement = document.getElementById('economiaGerada');

    if (totalGanhosElement) {
      totalGanhosElement.textContent = `R$ ${totalGanhos.toFixed(2)}`;
    }
    if (totalResgatesElement) {
      totalResgatesElement.textContent = `R$ ${totalResgates.toFixed(2)}`;
    }
    if (economiaElement) {
      economiaElement.textContent = `${economiaPercentual.toFixed(0)}%`;
    }
  },

  // === FUNÇÕES DE HISTÓRICO ===
  // === DADOS MOCKADOS ===
  getMockHistory: function() {
    return [
      {
        id: 1,
        type: 'ganho',
        description: 'Cashback da compra #1234',
        amount: 150.00,
        date: '2025-10-01T14:30:00',
        formatted_date: '01/10/2025 às 14:30'
      },
      {
        id: 2,
        type: 'ganho',
        description: 'Cashback da compra #1235',
        amount: 320.50,
        date: '2025-09-28T10:15:00',
        formatted_date: '28/09/2025 às 10:15'
      },
      {
        id: 3,
        type: 'resgate',
        description: 'Resgate de BaziCash',
        amount: -200.00,
        date: '2025-09-25T16:45:00',
        formatted_date: '25/09/2025 às 16:45'
      },
      {
        id: 4,
        type: 'ganho',
        description: 'Cashback da compra #1230',
        amount: 450.00,
        date: '2025-09-20T11:20:00',
        formatted_date: '20/09/2025 às 11:20'
      },
      {
        id: 5,
        type: 'resgate',
        description: 'Resgate de BaziCash',
        amount: -500.00,
        date: '2025-09-15T09:00:00',
        formatted_date: '15/09/2025 às 09:00'
      },
      {
        id: 6,
        type: 'ganho',
        description: 'Cashback da compra #1225',
        amount: 680.00,
        date: '2025-09-10T15:30:00',
        formatted_date: '10/09/2025 às 15:30'
      },
      {
        id: 7,
        type: 'ganho',
        description: 'Cashback da compra #1220',
        amount: 1549.50,
        date: '2025-09-05T13:10:00',
        formatted_date: '05/09/2025 às 13:10'
      }
    ];
  },

  // === HISTÓRICO ===
  loadHistory: async function(filterType = 'all') {
    const historyContainer = document.getElementById('bazicashHistory');

    if (!historyContainer) {
      console.error('Container do histórico não encontrado!');
      return;
    }

    historyContainer.innerHTML = '<div class="bazicash-loading">Carregando histórico...</div>';

    // Se modo MOCK estiver ativado, usar dados mockados
    if (this.USE_MOCK_DATA) {
      setTimeout(() => {
        const mockHistory = this.getMockHistory();
        this.cachedHistory = mockHistory;
        this.renderHistory(mockHistory, filterType);
        this.updateStats(mockHistory);
      }, 500);
      return;
    }

    // TODO: Implementar quando endpoint de histórico estiver disponível
    historyContainer.innerHTML = '<div class="bazicash-empty-history">Histórico em breve! 🚀</div>';
  },

  renderHistory: function(history, filterType = 'all') {
    const historyContainer = document.getElementById('bazicashHistory');

    if (!history || history.length === 0) {
      historyContainer.innerHTML = '<div class="bazicash-empty-history">Nenhuma transação encontrada</div>';
      return;
    }

    // Filtrar por tipo
    let filteredHistory = history;
    if (filterType === 'ganhos') {
      filteredHistory = history.filter(item => item.type === 'ganho');
    } else if (filterType === 'resgates') {
      filteredHistory = history.filter(item => item.type === 'resgate');
    }

    if (filteredHistory.length === 0) {
      historyContainer.innerHTML = '<div class="bazicash-empty-history">Nenhuma transação encontrada nesta categoria</div>';
      return;
    }

    // Renderizar itens
    let html = '';
    filteredHistory.forEach((item, index) => {
      const amountClass = item.type === 'ganho' ? 'ganho' : 'resgate';
      const amountPrefix = item.type === 'ganho' ? '+' : '';

      html += `
        <div class="bazicash-history-item" style="animation-delay: ${index * 0.05}s">
          <div class="bazicash-history-info">
            <div class="bazicash-history-description">${item.description}</div>
            <div class="bazicash-history-date">${item.formatted_date}</div>
          </div>
          <div class="bazicash-history-amount ${amountClass}">
            ${amountPrefix}R$ ${Math.abs(item.amount).toFixed(2).replace('.', ',')}
          </div>
        </div>
      `;
    });

    historyContainer.innerHTML = html;
  },

  switchHistoryTab: function(tabType) {
    // Atualizar aparência das abas
    document.querySelectorAll('.bazicash-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const targetTab = document.querySelector(`[data-tab="${tabType}"]`);
    if (targetTab) {
      targetTab.classList.add('active');
    }

    // Recarregar histórico com filtro
    this.loadHistory(tabType);
  },

  // Handler para cliques nas abas usando event delegation
  handleTabClick: function(event) {
    // Encontrar o botão (pode ser clicado no span ou no botão)
    const button = event.target.closest('.bazicash-tab-btn');
    if (button) {
      const tabType = button.getAttribute('data-tab');
      if (tabType) {
        BaziCash.switchHistoryTab(tabType);
      }
    }
  },

  // === FUNÇÕES DE RESGATE ===
  redeem: async function() {
    const amountInput = document.getElementById('redeemAmount');
    const redeemBtn = document.querySelector('.bazicash-redeem-btn');
    const amount = parseFloat(amountInput.value);

    if (!this.customerCPF) {
      this.showMessage('CPF não configurado', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      this.showMessage('Digite um valor válido para resgate', 'error');
      return;
    }

    // Validar saldo suficiente (cache local)
    if (this.cachedBalance && amount > this.cachedBalance) {
      this.showMessage(`Saldo insuficiente. Disponível: R$ ${this.cachedBalance.toFixed(2)}`, 'warning');
      return;
    }

    try {
      redeemBtn.disabled = true;
      redeemBtn.innerHTML = '<span class="btn-icon">⏳</span> Processando...';
      this.clearMessage();

      // Fazer requisição para API de saque
      const result = await this.withdrawBalance(amount);

      if (result.success && result.data) {
        this.showMessage('Resgate realizado com sucesso! 🎉', 'success');
        amountInput.value = '';
        
        // Atualizar saldo com o novo valor retornado
        if (result.data.new_balance !== undefined) {
          this.cachedBalance = result.data.new_balance;
          const balanceElement = document.getElementById('bazicashBalance');
          const bazicashAmount = Math.round(result.data.new_balance);
          if (balanceElement) {
            balanceElement.textContent = `${bazicashAmount} BaziCash`;
          }
          this.updateFloatingButtonBadge(bazicashAmount);
        } else {
          // Se não retornou novo saldo, recarregar
          setTimeout(() => this.loadBalance(), 1000);
        }
      } else {
        this.showMessage(result.message || 'Erro ao processar resgate', 'error');
      }
    } catch (error) {
      console.error('❌ Erro no resgate:', error);
      this.showMessage('Erro de conexão. Tente novamente.', 'error');
    } finally {
      redeemBtn.disabled = false;
      redeemBtn.innerHTML = '<span class="btn-icon">💸</span> Resgatar';
    }
  },

  // === INICIALIZAÇÃO ===
  init: function() {
    console.log('🚀 BaziCash inicializando...');

    // Configurar CPF e email do cliente (vem do Liquid template)
    this.customerCPF = window.bazicashCustomerCPF || null;
    this.customerEmail = window.bazicashCustomerEmail || null;

    // Se modo MOCK, definir saldo mockado
    if (this.USE_MOCK_DATA) {
      this.cachedBalance = 2450;
      console.log('🎭 MODO MOCK ATIVADO - Usando dados de exemplo');
    }

    console.log('📋 Cliente configurado:', {
      cpf: this.customerCPF ? '***' : 'não definido',
      email: this.customerEmail || 'não definido'
    });
    
    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
      console.log('✅ DOM carregado - Iniciando BaziCash');

      // Carregar histórico automaticamente se estiver na página
      const historyContainer = document.getElementById('bazicashHistory');
      if (historyContainer) {
        console.log('📊 Carregando histórico...');
        this.loadHistory('all');

        // Adicionar event listeners para as abas
        const historyTabs = document.querySelector('.bazicash-history-tabs');
        if (historyTabs) {
          historyTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.bazicash-tab-btn');
            if (button) {
              const tabType = button.getAttribute('data-tab');
              if (tabType) {
                this.switchHistoryTab(tabType);
              }
            }
          });
          console.log('✅ Event listeners das abas adicionados');
        }
      }

      // Adicionar event listener ao botão flutuante
      const floatingButton = document.getElementById('bazicashFloatingButton');
      if (floatingButton) {
        floatingButton.addEventListener('click', (e) => {
          e.preventDefault();
          console.log('🔘 Botão clicado via event listener');
          this.openModal();
        });
        console.log('✅ Event listener adicionado ao botão flutuante');
      } else {
        console.warn('⚠️ Botão flutuante não encontrado no DOM');
      }

      // Permite resgate com Enter
      const amountInput = document.getElementById('redeemAmount');
      if (amountInput) {
        amountInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.redeem();
          }
        });
      }
    });

    // Fechar modal ao clicar fora dele
    window.onclick = (event) => {
      const modal = document.getElementById('bazicashModal');
      if (event.target === modal) {
        this.closeModal();
      }
    };
    
    console.log('✅ BaziCash inicializado com sucesso');
  }
};

// === FUNÇÕES GLOBAIS PARA COMPATIBILIDADE ===
// Estas funções mantêm a compatibilidade com o HTML existente
function openBazicashModal() {
  BaziCash.openModal();
}

function closeBazicashModal() {
  BaziCash.closeModal();
}

function redeemBazicash() {
  BaziCash.redeem();
}

// === INICIALIZAÇÃO AUTOMÁTICA ===
BaziCash.init();
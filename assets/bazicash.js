/**
 * ==========================================
 * BAZICASH - Sistema de Cashback
 * Arquivo JavaScript modularizado para melhor manutenção
 * ==========================================
 */

// === CONFIGURAÇÃO E DADOS MOCKADOS ===
const BaziCash = {
  // Variáveis globais
  customerEmail: null,

  // DADOS MOCKADOS PARA DESENVOLVIMENTO
  // TODO: Remover quando integrar com SDK real
  MOCK_DATA: {
    balance: 125.50,
    history: [
      {
        id: 1,
        type: 'ganho',
        amount: 45.30,
        description: 'Compra #1001 - Tênis Nike',
        date: '2024-01-15',
        timestamp: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        type: 'ganho',
        amount: 23.50,
        description: 'Compra #1002 - Camiseta Adidas',
        date: '2024-01-18',
        timestamp: '2024-01-18T14:20:00Z'
      },
      {
        id: 3,
        type: 'resgate',
        amount: -15.00,
        description: 'Resgate utilizado na compra #1003',
        date: '2024-01-20',
        timestamp: '2024-01-20T16:45:00Z'
      },
      {
        id: 4,
        type: 'ganho',
        amount: 67.20,
        description: 'Compra #1004 - Kit Esportivo',
        date: '2024-01-25',
        timestamp: '2024-01-25T11:15:00Z'
      },
      {
        id: 5,
        type: 'resgate',
        amount: -25.00,
        description: 'Resgate utilizado na compra #1005',
        date: '2024-01-28',
        timestamp: '2024-01-28T09:30:00Z'
      },
      {
        id: 6,
        type: 'ganho',
        amount: 34.80,
        description: 'Compra #1006 - Shorts Nike',
        date: '2024-02-02',
        timestamp: '2024-02-02T13:20:00Z'
      },
      {
        id: 7,
        type: 'resgate',
        amount: -10.50,
        description: 'Resgate utilizado na compra #1007',
        date: '2024-02-05',
        timestamp: '2024-02-05T15:10:00Z'
      },
      {
        id: 8,
        type: 'ganho',
        amount: 89.70,
        description: 'Compra #1008 - Jaqueta Puma',
        date: '2024-02-10',
        timestamp: '2024-02-10T12:45:00Z'
      }
    ]
  },

  // === FUNÇÕES DE MODAL ===
  openModal: function() {
    document.getElementById('bazicashModal').style.display = 'block';
    document.body.style.overflow = 'hidden'; // Previne scroll da página
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

  // === FUNÇÕES DE API ===
  makeAppProxyRequest: async function(endpoint, data = null) {
    const baseUrl = window.location.origin + '/apps/bazicash';

    try {
      const options = {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${baseUrl}${endpoint}`, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na requisição ao app proxy:', error);
      throw error;
    }
  },

  // === FUNÇÕES DE SALDO ===
  loadBalance: async function() {
    const balanceElement = document.getElementById('bazicashBalance');
    const email = this.getCustomerEmail();

    if (!email) {
      balanceElement.textContent = 'R$ 125,50 (DEMO)';
      this.updateFloatingButtonBadge(125.50); // Atualizar badge também
      this.updateStats(); // Atualizar estatísticas também
      this.loadHistory(); // Carregar histórico mesmo sem login para demonstração
      this.showMessage('Visualização de demonstração - faça login para dados reais', 'warning');
      return;
    }

    try {
      balanceElement.textContent = 'Carregando...';

      // Simulando delay da API
      await new Promise(resolve => setTimeout(resolve, 800));

      // Usando dados mockados ao invés de fazer requisição real
      balanceElement.textContent = `R$ ${this.MOCK_DATA.balance.toFixed(2)}`;

      // Atualizar badge do botão flutuante
      this.updateFloatingButtonBadge(this.MOCK_DATA.balance);

      // Atualizar estatísticas
      this.updateStats();

      // Carregar histórico também
      this.loadHistory();

    } catch (error) {
      balanceElement.textContent = 'Erro ao carregar saldo';
      this.showMessage('Erro de conexão. Tente novamente.', 'error');
    }
  },

  updateFloatingButtonBadge: function(balance) {
    const badgeElement = document.getElementById('floatingButtonBadge');
    if (badgeElement) {
      badgeElement.textContent = `R$ ${balance.toFixed(2)}`;

      // Adicionar animação de atualização
      badgeElement.style.transform = 'scale(1.2)';
      setTimeout(() => {
        badgeElement.style.transform = 'scale(1)';
      }, 200);
    }
  },

  // === FUNÇÕES DE ESTATÍSTICAS ===
  updateStats: function() {
    const history = this.MOCK_DATA.history;

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
  loadHistory: function(filterType = 'all') {
    const historyContainer = document.getElementById('bazicashHistory');

    if (!historyContainer) {
      console.error('Container do histórico não encontrado!');
      return;
    }

    let history = this.MOCK_DATA.history;

    // Filtrar por tipo se necessário
    if (filterType === 'ganhos') {
      history = history.filter(item => item.type === 'ganho');
    } else if (filterType === 'resgates') {
      history = history.filter(item => item.type === 'resgate');
    }

    // Ordenar por data (mais recente primeiro)
    history = history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (history.length === 0) {
      historyContainer.innerHTML = '<div class="bazicash-empty-history">Nenhuma transação encontrada para este filtro.</div>';
      return;
    }

    // Debug: Forçar exibição se estiver vazio
    if (!historyContainer.innerHTML || historyContainer.innerHTML.includes('Carregando')) {
      // Container estava vazio, vamos popular
    }

    let historyHTML = '';
    history.forEach((item, index) => {
      const formattedDate = new Date(item.date).toLocaleDateString('pt-BR');
      const amountClass = item.type;
      const amountText = item.type === 'ganho' ? `+R$ ${item.amount.toFixed(2)}` : `R$ ${item.amount.toFixed(2)}`;
      const animationDelay = index * 0.1; // Delay escalonado

      historyHTML += `
        <div class="bazicash-history-item" style="animation-delay: ${animationDelay}s">
          <div class="bazicash-history-info">
            <div class="bazicash-history-description">${item.description}</div>
            <div class="bazicash-history-date">${formattedDate}</div>
          </div>
          <div class="bazicash-history-amount ${amountClass}">${amountText}</div>
        </div>
      `;
    });

    historyContainer.innerHTML = historyHTML;
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
    if (event.target.classList.contains('bazicash-tab-btn')) {
      const tabType = event.target.getAttribute('data-tab');
      if (tabType) {
        BaziCash.switchHistoryTab(tabType);
      }
    }
  },

  // === FUNÇÕES DE RESGATE ===
  redeem: async function() {
    const amountInput = document.getElementById('redeemAmount');
    const redeemBtn = document.querySelector('.bazicash-redeem-btn');
    const email = this.getCustomerEmail();
    const amount = parseFloat(amountInput.value);

    if (!email) {
      this.showMessage('É necessário estar logado para resgatar Bazicash', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      this.showMessage('Digite um valor válido para resgate', 'error');
      return;
    }

    try {
      redeemBtn.disabled = true;
      redeemBtn.textContent = 'Processando...';
      this.clearMessage();

      const response = await this.makeAppProxyRequest('/redeem', {
        customer_email: email,
        amount: amount
      });

      if (response.success) {
        this.showMessage(response.message || 'Resgate realizado com sucesso!', 'success');
        amountInput.value = '';
        // Atualiza o saldo após o resgate
        setTimeout(() => this.loadBalance(), 1000);
      } else {
        this.showMessage(response.message || 'Erro ao processar resgate', 'error');
      }
    } catch (error) {
      this.showMessage('Erro de conexão. Tente novamente.', 'error');
    } finally {
      redeemBtn.disabled = false;
      redeemBtn.textContent = 'Resgatar';
    }
  },

  // === INICIALIZAÇÃO ===
  init: function() {
    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
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
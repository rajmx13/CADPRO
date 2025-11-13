// ==============================================================================
// 1. ESTRUTURA DE DADOS E FUNÇÕES DE ARMAZENAMENTO (LOAD/SAVE)
// ==============================================================================

// Variável global para armazenar as referências das seções do DOM.
let sections = {}; 
// Variável global para a função de transição de tela.
let showSection;
// Variável global para a função de renderização de dashboard.
let renderDashboard;

// Variável global para armazenar processos válidos do último backup lido.
let PROCESSOS_DO_BACKUP_VALIDOS = []; 

// Chave para armazenar os usuários no localStorage
const USUARIOS_DB_KEY = 'usuarios_db';

// Função para hash de senhas (usando crypto API do browser para segurança)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Função para salvar dados no localStorage
 */
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`Dados salvos em ${key}:`, data);
    return true;
  } catch (error) {
    handleError(error, `Erro ao salvar ${key} no localStorage.`);
    return false;
  }
}

/**
 * Função para carregar dados do localStorage
 */
function loadFromLocalStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    const parsedData = data ? JSON.parse(data) : defaultValue;
    
    // Garante que o USUARIOS_DB é um objeto.
    if (key === USUARIOS_DB_KEY && Array.isArray(parsedData)) {
      return { "admin": "123456" }; // Força o objeto padrão se houver erro de tipo
    }
    return parsedData;
  } catch (error) {
    handleError(error, `Erro ao carregar ${key} do localStorage.`);
    return defaultValue;
  }
}

// Variável global que armazena o banco de dados de usuários.
let USUARIOS_DB = loadFromLocalStorage(USUARIOS_DB_KEY, {});

// Inicializa admin com hash se não existir
(async () => {
  if (!USUARIOS_DB['admin']) {
    USUARIOS_DB['admin'] = await hashPassword('123456');
    saveToLocalStorage(USUARIOS_DB_KEY, USUARIOS_DB);
  }
})();


// ==============================================================================
// 2. FUNÇÕES DE VALIDAÇÃO E UTILIDADE (ESCOPO GLOBAL)
// ==============================================================================

// Função handler centralizada para erros
function handleError(error, message) {
  console.error(error);
  alert(message || 'Ocorreu um erro inesperado. Verifique o console para detalhes.');
}

// Função para formatar data de yyyy-mm-dd para dd-mm-yyyy
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    if (year.length === 4) return `${day}-${month}-${year}`;
  }
  return dateStr;
}

// Função para converter dd-mm-yyyy para yyyy-mm-dd (não necessária com type="date")
function parseDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) return dateStr; // Já yyyy-mm-dd
  const [day, month, year] = dateStr.split('-');
  if (!day || !month || !year) return ''; 
  return `${year}-${month}-${day}`;
}

// Função para validar e converter data (para objeto Date)
function parseToDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

// Função para validar número do processo
function validarNumeroProcesso(numero) {
  return /^\d{5}e\d{2}$/.test(numero);
}

// NOVO: Função para verificar se o número do processo já existe (PONTO 1)
function verificarDuplicidadeNumeroProcesso(numero) {
    const processos = loadFromLocalStorage('processos', []);
    return processos.some(p => p.numero === numero);
}

// Função para validar ordem de datas (avançada)
function validarDatas({ dataEntrada, dataDesignacao, dataConclusao, dataSaida }, errorSpans = {}) {
  const entrada = parseToDate(dataEntrada);
  const designacao = parseToDate(dataDesignacao);
  const conclusao = parseToDate(dataConclusao);
  const saida = parseToDate(dataSaida);

  // Limpa erros anteriores
  Object.values(errorSpans).forEach(span => { if (span) span.textContent = ''; });

  if (!dataEntrada || !entrada) {
    if (errorSpans.entrada) errorSpans.entrada.textContent = 'Data de Entrada é obrigatória/inválida.';
    return true; // Tem erro
  }
  if (dataDesignacao && !designacao) {
    if (errorSpans.designacao) errorSpans.designacao.textContent = 'Data de Designação inválida.';
    return true;
  }
  if (dataConclusao && !conclusao) {
    if (errorSpans.conclusao) errorSpans.conclusao.textContent = 'Data de Conclusão inválida.';
    return true;
  }
  if (dataSaida && !saida) {
    if (errorSpans.saida) errorSpans.saida.textContent = 'Data de Saída inválida.';
    return true;
  }
  if (dataSaida && !dataConclusao) {
    if (errorSpans.conclusao) errorSpans.conclusao.textContent = 'Data de Conclusão é obrigatória quando Data de Saída está preenchida.';
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (entrada > today) {
    if (errorSpans.entrada) errorSpans.entrada.textContent = 'Data de Entrada não pode ser futura.';
    return true;
  }

  if (entrada && saida && saida < entrada) {
    if (errorSpans.saida) errorSpans.saida.textContent = 'Data de Saída não pode ser anterior à Data de Entrada.';
    return true;
  }
  if (designacao && conclusao && conclusao < designacao) {
    if (errorSpans.conclusao) errorSpans.conclusao.textContent = 'Data de Conclusão não pode ser anterior à Data de Designação.';
    return true;
  }
  if (conclusao && saida && saida < conclusao) {
    if (errorSpans.saida) errorSpans.saida.textContent = 'Data de Saída não pode ser anterior à Data de Conclusão.';
    return true;
  }
  
  return false; // Sem erros
}

// Função para calcular dias úteis entre duas datas (com feriados)
const holidays = new Set([
  '2025-01-01', // Confraternização Universal
  '2025-04-18', // Sexta-feira Santa
  '2025-04-21', // Tiradentes
  '2025-05-01', // Dia do Trabalho
  '2025-06-19', // Corpus Christi
  '2025-09-07', // Independência
  '2025-10-12', // Nossa Senhora Aparecida
  '2025-11-02', // Finados
  '2025-11-15', // Proclamação da República
  '2025-11-20', // Consciência Negra
  '2025-12-25'  // Natal
]);

function calculateBusinessDays(startDate, endDate) {
  let currentDate = new Date(startDate);
  let businessDays = 0;
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateStr)) {
      businessDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return businessDays;
}

// Função para calcular dias úteis restantes e status (com feriados)
function getRemainingBusinessDays(dataEnvio) {
  const envioDate = new Date(dataEnvio);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(envioDate);
  let businessDays = 0;
  while (businessDays < 15) {
    deadline.setDate(deadline.getDate() + 1);
    const dayOfWeek = deadline.getDay();
    const dateStr = deadline.toISOString().split('T')[0];
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.has(dateStr)) {
      businessDays++;
    }
  }
  if (today > deadline) {
    return { text: 'PRAZO ESGOTADO', class: 'prazo-esgotado' };
  }
  const remainingDays = calculateBusinessDays(today, deadline) - 1;
  if (remainingDays <= 2) {
    return { text: `${remainingDays} dias úteis`, class: 'prazo-aviso' };
  }
  return { text: `${remainingDays} dias úteis`, class: '' };
}

// Função para verificar prazos na inicialização
function checkDeadlinesOnLoad() {
  const envios = loadFromLocalStorage('envios');
  const alertMessages = [];
  envios.forEach(envio => {
    const prazo = getRemainingBusinessDays(envio.dataEnvio);
    if (prazo.class === 'prazo-esgotado') {
      alertMessages.push(`Processo ${envio.numero}: PRAZO ESGOTADO`);
    } else if (prazo.class === 'prazo-aviso') {
      alertMessages.push(`Processo ${envio.numero}: ${prazo.text} restantes`);
    }
  });
  if (alertMessages.length > 0) {
    alert('Atenção:\n' + alertMessages.join('\n'));
  }
}

// Função genérica para renderizar tabelas (otimização para evitar duplicação)
function renderTable(tbodySelector, data, columns, checkboxClass, originalData) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach((item, index) => {
    const originalIndex = originalData ? originalData.findIndex(p => p.numero === item.numero) : index;
    const row = document.createElement('tr');
    let innerHTML = `<td><input type="checkbox" class="${checkboxClass}" data-index="${originalIndex}"></td>`;
    columns.forEach(col => {
      let value = item[col.key] || '';
      if (col.format) value = col.format(value);
      innerHTML += `<td class="${col.class || ''}">${col.isHTML ? value : value}</td>`;
    });
    row.innerHTML = innerHTML;
    tbody.appendChild(row);
  });
}

// ==============================================================================
// 3. FLUXOS DE ACESSO E CADASTRO
// ==============================================================================

// Fluxo de Acesso (Login) - Corresponde ao item 2 do fluxo
async function fluxoLogin(e) {
  e.preventDefault();
  
  const nomeAcesso = document.getElementById('nome-acesso')?.value.trim();
  const senha = document.getElementById('senha-login')?.value.trim();
  const erroMsg = document.getElementById('mensagem-erro-login');
  
  if (erroMsg) erroMsg.textContent = ''; 

  const hashedSenha = await hashPassword(senha);
  if (nomeAcesso && USUARIOS_DB.hasOwnProperty(nomeAcesso) && USUARIOS_DB[nomeAcesso] === hashedSenha) {
    // Acesso Concedido: Transição direta
    const header = document.querySelector('header');
    if (header) {
      header.classList.remove('hidden'); 
    }
    if (typeof showSection === 'function') {
      showSection('dashboard'); 
    }
    if (typeof renderDashboard === 'function') {
      renderDashboard(); 
    }
    alert("Acesso Concedido! Bem-vindo(a)!");
  } 
  else {
    if (erroMsg) erroMsg.textContent = "Usuário ou senha inválidos. Se não tem conta, cadastre-se.";
  }
}

// Fluxo de Cadastro de Novo Usuário - Corresponde ao item 3 do fluxo
async function fluxoCadastro(e) {
  e.preventDefault();
  
  const novoNome = document.getElementById('novo-nome-acesso')?.value.trim();
  const novaSenha = document.getElementById('nova-senha')?.value.trim();
  const erroMsg = document.getElementById('mensagem-erro-cadastro');

  if (erroMsg) erroMsg.textContent = ''; 

  if (!novoNome || !novaSenha) {
    if (erroMsg) erroMsg.textContent = "Preencha todos os campos.";
    return;
  }

  // 3.1. Validação de Nome de Acesso: verifica se o usuário já existe
  if (USUARIOS_DB.hasOwnProperty(novoNome)) {
    if (erroMsg) erroMsg.textContent = "Nome de Acesso já existe. Tente outro.";
    return;
  }
  
  // 3.2. Regra de Senha (Validação)
  if (novaSenha.length < 6) {
    if (erroMsg) erroMsg.textContent = "A senha deve ter no mínimo 6 caracteres.";
    return;
  }
  // SENÃO (A senha é válida)
  else {
    const hashedNovaSenha = await hashPassword(novaSenha);
    USUARIOS_DB[novoNome] = hashedNovaSenha;
    // Salva no localStorage (simulação de DB)
    saveToLocalStorage(USUARIOS_DB_KEY, USUARIOS_DB);
    
    alert("Cadastro realizado com sucesso! Faça login com seu novo usuário.");
    
    const formCadastroUsuario = document.getElementById('form-cadastro-usuario');
    if (formCadastroUsuario) formCadastroUsuario.reset();
    
    if (typeof showSection === 'function') {
      showSection('login'); // Volta para a tela de Login
    }
  }
}

// ==============================================================================
// 4. FUNÇÕES DE SINCROINZAÇÃO DE SCROLL (PONTO 2)
// ==============================================================================

/**
 * Configura a sincronização de rolagem horizontal entre uma barra superior simulada 
 * (sticky) e o wrapper da tabela (que contém a rolagem real).
 */
function setupTableScrollSync() {
    const topScroll = document.getElementById('scroll-sync-listagem');
    const tableWrapper = document.getElementById('tabela-processos-wrapper');
    const tableElement = document.getElementById('tabela-processos');
    const filler = document.getElementById('filler-listagem');

    if (!topScroll || !tableWrapper || !tableElement || !filler) {
        // Ignora se os elementos específicos não existirem (ex: em outras telas)
        return;
    }

    // 1. Define a largura do elemento interno (filler) do scroll superior 
    //    para forçar o scroll horizontal a ter a largura total da tabela.
    const tableScrollWidth = tableElement.scrollWidth;
    filler.style.width = tableScrollWidth + 'px';
    
    // 2. Sincroniza a rolagem do wrapper real (inferior) para o topo.
    //    O scroll real acontece no tableWrapper.
    tableWrapper.onscroll = () => {
        topScroll.scrollLeft = tableWrapper.scrollLeft;
    };
    
    // 3. Sincroniza a rolagem do topo (simulação) para o wrapper real.
    topScroll.onscroll = () => {
        tableWrapper.scrollLeft = topScroll.scrollLeft;
    };
    
    // 4. Se a tabela couber, oculta o scroll forçado do topo.
    const containerWidth = tableWrapper.clientWidth;
    if (containerWidth >= tableScrollWidth) {
        topScroll.style.overflowX = 'hidden';
    } else {
        topScroll.style.overflowX = 'scroll';
    }
}


// ==============================================================================
// 5. FUNÇÕES DO APLICATIVO E INICIALIZAÇÃO (DENTRO DO DOMContentLoaded)
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Popula o objeto 'sections' global aqui
  sections = {
    login: document.getElementById('login'), 
    cadastroUsuario: document.getElementById('cadastro-usuario'), 
    dashboard: document.getElementById('dashboard'),
    cadastro: document.getElementById('cadastro'),
    listagem: document.getElementById('listagem'),
    alteracao: document.getElementById('alteracao'),
    envio: document.getElementById('envio'),
    acompanhamento: document.getElementById('acompanhamento'),
    exportarExcel: document.getElementById('exportar-excel'),
    backup: document.getElementById('backup'),
    restaurar: document.getElementById('restaurar'),
    sair: document.getElementById('sair')
  };

  const buttons = {
    cadastrar: document.getElementById('btn-cadastrar'),
    listar: document.getElementById('btn-listar'),
    alterar: document.getElementById('btn-alterar'),
    enviar: document.getElementById('btn-enviar'),
    acompanhar: document.getElementById('btn-acompanhar'),
    manutencao: document.getElementById('btn-manutencao'),
    exportar: document.getElementById('btn-exportar'),
    exportarPdf: document.getElementById('btn-exportar-pdf'),
    backup: document.getElementById('btn-backup'),
    restaurar: document.getElementById('btn-restaurar'),
    sair: document.getElementById('btn-sair'),
    sairSim: document.getElementById('btn-sair-sim'),
    sairNao: document.getElementById('btn-sair-nao')
  };

  const submenuManutencao = document.getElementById('submenu-manutencao');
  const inputRestaurar = document.getElementById('input-restaurar');

  // FUNÇÃO AUXILIAR PARA FECHAR SUBMENU
  const fecharSubmenuManutencao = function() {
    if (submenuManutencao && !submenuManutencao.classList.contains('hidden')) {
        submenuManutencao.classList.add('hidden');
    }
  };

  // 2. Define showSection como função global AQUI
  showSection = function(sectionId) {
    // Usa o objeto sections que agora foi populado
    Object.values(sections).forEach(section => {
      if (section) section.classList.add('hidden');
    });

    const targetSection = sections[sectionId];
    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.focus(); // Melhoria de acessibilidade: foco na seção nova
    } else {
      console.error(`Seção ${sectionId} não encontrada em showSection.`, sections);
    }
    // FECHA SUBMENU AO MUDAR DE SEÇÃO
    fecharSubmenuManutencao();
  };

  // 3. Funções de transição locais
  const mostrarTelaLoginLocal = function() {
    showSection('login');
    const formLogin = document.getElementById('form-login');
    if (formLogin) formLogin.reset();
    const erroMsg = document.getElementById('mensagem-erro-login');
    if (erroMsg) erroMsg.textContent = '';
    const header = document.querySelector('header');
    if (header) header.classList.add('hidden'); 
  };

  const mostrarTelaCadastroUsuarioLocal = function() {
    showSection('cadastroUsuario'); 
    const formCadastroUsuario = document.getElementById('form-cadastro-usuario');
    if (formCadastroUsuario) formCadastroUsuario.reset();
    const erroMsg = document.getElementById('mensagem-erro-cadastro');
    if (erroMsg) erroMsg.textContent = '';
  };

  // Função renderDashboard (mantida a definição aqui)
  renderDashboard = async function() {
    const processos = loadFromLocalStorage('processos');
    const ctxPrioridade = document.getElementById('graficoPrioridade')?.getContext('2d');
    const ctxEncarregado = document.getElementById('graficoEncarregado')?.getContext('2d');

    const prioridades = { Alta: 0, Média: 0, Baixa: 0 };
    const encarregados = {};
    processos.forEach(p => {
      if (p.prioridade) prioridades[p.prioridade]++;
      if (p.encarregado) {
        encarregados[p.encarregado] = (encarregados[p.encarregado] || 0) + 1;
      }
    });

    if (window.prioridadeChart) window.prioridadeChart.destroy();
    if (ctxPrioridade) {
      window.prioridadeChart = new Chart(ctxPrioridade, {
        type: 'pie',
        data: {
          labels: Object.keys(prioridades),
          datasets: [{
            data: Object.values(prioridades),
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Processos por Prioridade' }
          }
        }
      });
    }

    if (window.encarregadoChart) window.encarregadoChart.destroy();
    if (ctxEncarregado) {
      window.encarregadoChart = new Chart(ctxEncarregado, {
        type: 'bar',
        data: {
          labels: Object.keys(encarregados),
          datasets: [{
            label: 'Processos por Encarregado da Elaboração',
            data: Object.values(encarregados),
            backgroundColor: '#36a2eb'
          }]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } },
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Processos por Encarregado da Elaboração' }
          }
        }
      });
    }
  };

  // Função Exportar para PDF
  function exportToPDF() {
    if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
      handleError(null, 'Erro: Biblioteca de exportação para PDF não carregada. Verifique sua conexão com a internet.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Relatório de Processos', 10, 10);
    doc.setFontSize(12);
    const processos = loadFromLocalStorage('processos');
    if (processos.length === 0) {
      alert('Nenhum processo para exportar.');
      return;
    }
    let y = 20;
    processos.forEach((processo, index) => {
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
      doc.text(`${index + 1}. Processo: ${processo.numero || ''}`, 10, y);
      doc.text(`Unidade: ${processo.unidade || ''}`, 10, y + 5);
      doc.text(`Prioridade: ${processo.prioridade || ''}`, 10, y + 10);
      doc.text(`Origem: ${processo.origem || ''}`, 10, y + 15);
      doc.text(`Data de Entrada: ${formatDate(processo.dataEntrada) || ''}`, 10, y + 20);
      y += 30;
    });
    doc.save('relatorio_processos.pdf');
    alert('PDF gerado com sucesso!');
    showSection('dashboard');
  }

  // CONEXÃO DOS EVENTOS DE ACESSO E CADASTRO
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', fluxoLogin);
  }
  const formCadastroUsuario = document.getElementById('form-cadastro-usuario');
  if (formCadastroUsuario) {
    formCadastroUsuario.addEventListener('submit', fluxoCadastro);
  }
  
  // Listener para abrir a tela de cadastro
  const btnIrCadastro = document.getElementById('btn-ir-cadastro');
  if (btnIrCadastro) {
    btnIrCadastro.addEventListener('click', mostrarTelaCadastroUsuarioLocal);
  }
  
  // Listener para voltar para a tela de login
  const btnVoltarLogin = document.getElementById('btn-voltar-login');
  if (btnVoltarLogin) {
    btnVoltarLogin.addEventListener('click', mostrarTelaLoginLocal);
  }

  // Evento do botão SIM (sair)
  if (buttons.sairSim) buttons.sairSim.addEventListener('click', () => {
    console.log('Saída confirmada. Retornando ao login.');
    mostrarTelaLoginLocal();
  });
  
  // Evento do botão NÃO (sair) - Volta ao dashboard
  if (buttons.sairNao) buttons.sairNao.addEventListener('click', () => {
    showSection('dashboard');
  });

  // Listeners para botões do menu
  if (buttons.cadastrar) buttons.cadastrar.addEventListener('click', () => showSection('cadastro'));
  if (buttons.listar) buttons.listar.addEventListener('click', () => { showSection('listagem'); renderProcessos(); });
  if (buttons.alterar) buttons.alterar.addEventListener('click', () => showSection('alteracao'));
  if (buttons.enviar) buttons.enviar.addEventListener('click', () => { showSection('envio'); renderEnvioAtividade(); });
  if (buttons.acompanhar) buttons.acompanhar.addEventListener('click', () => { showSection('acompanhamento'); renderAcompanhar(); });
  if (buttons.exportar) buttons.exportar.addEventListener('click', () => showSection('exportarExcel'));
  if (buttons.exportarPdf) buttons.exportarPdf.addEventListener('click', exportToPDF);
  if (buttons.backup) buttons.backup.addEventListener('click', () => showSection('backup'));
  if (buttons.restaurar) buttons.restaurar.addEventListener('click', () => showSection('restaurar'));
  if (buttons.sair) buttons.sair.addEventListener('click', () => showSection('sair'));
  
  // LISTENER PARA BOTÃO MANUTENÇÃO
  if (buttons.manutencao) buttons.manutencao.addEventListener('click', (e) => {
    e.stopPropagation(); // Impede o fechamento imediato do evento global
    const submenu = document.getElementById('submenu-manutencao');
    if (submenu) {
        submenu.classList.toggle('hidden'); // Alterna a classe hidden
    }
  });

  // LISTENER GLOBAL PARA FECHAR SUBMENU AO CLICAR FORA
  document.addEventListener('click', (e) => {
    const submenu = document.getElementById('submenu-manutencao');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    // Verifica se o submenu existe, está aberto e o clique não foi no contêiner pai
    if (submenu && !submenu.classList.contains('hidden') && dropdownMenu && !dropdownMenu.contains(e.target)) {
        fecharSubmenuManutencao();
    }
  });

  // NOVO: Listener para validação de duplicidade (PONTO 1)
  const inputNumeroProcesso = document.getElementById('numero-processo');
  const errorNumeroProcesso = document.getElementById('error-numero-processo');

  if (inputNumeroProcesso) {
      inputNumeroProcesso.addEventListener('input', () => {
          const numero = inputNumeroProcesso.value.trim();
          
          if (numero === '') {
              errorNumeroProcesso.textContent = '';
              inputNumeroProcesso.setCustomValidity('');
              return;
          }

          if (verificarDuplicidadeNumeroProcesso(numero)) {
              errorNumeroProcesso.textContent = 'ERRO: Já existe um processo com este número.';
              inputNumeroProcesso.setCustomValidity('Duplicado');
          } else if (!validarNumeroProcesso(numero)) {
              errorNumeroProcesso.textContent = 'Número do processo inválido (formato: 12345e25).';
              inputNumeroProcesso.setCustomValidity('Inválido');
          } else {
              errorNumeroProcesso.textContent = '';
              inputNumeroProcesso.setCustomValidity(''); // Validação OK
          }
      });
  }

  // Evento do formulário de cadastro de processo (ajustado para checar validade/duplicidade)
  document.getElementById('form-cadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // NOVO: Se o campo já estiver marcado como inválido pela duplicidade/formato, interrompe
    if (inputNumeroProcesso && inputNumeroProcesso.checkValidity() === false) {
        // A mensagem de erro já está no span
        return;
    }
      
    const formData = {
      numero: document.getElementById('numero-processo')?.value.trim(),
      unidade: document.getElementById('unidade')?.value.trim(),
      prioridade: document.getElementById('prioridade')?.value,
      origem: document.getElementById('origem')?.value.trim(),
      dataEntrada: document.getElementById('data-entrada')?.value, // yyyy-mm-dd
      dataDesignacao: document.getElementById('data-designacao')?.value,
      dataConclusao: document.getElementById('data-conclusao')?.value,
      dataSaida: document.getElementById('data-saida')?.value,
      tipoDemanda: document.getElementById('tipo-demanda')?.value,
      natureza: document.getElementById('natureza')?.value.trim(),
      anoPti: document.getElementById('ano-pti')?.value.trim(),
      semestre: document.getElementById('semestre')?.value,
      meta: document.getElementById('meta')?.value,
      encarregado: document.getElementById('encarregado')?.value,
      observacoes: document.getElementById('observacoes')?.value.trim()
    };
    
    // Verificação final de duplicidade no submit (fallback, caso o input event falhe)
    if (verificarDuplicidadeNumeroProcesso(formData.numero)) {
        if(errorNumeroProcesso) errorNumeroProcesso.textContent = 'ERRO: Já existe um processo com este número.';
        return;
    }

    const errorSpans = {
      entrada: document.getElementById('error-data-entrada'),
      designacao: document.getElementById('error-data-designacao'),
      conclusao: document.getElementById('error-data-conclusao'),
      saida: document.getElementById('error-data-saida')
    };
    const hasError = validarDatas(formData, errorSpans);
    if (hasError) {
      return;
    }

    const processos = loadFromLocalStorage('processos', []);
    processos.push(formData);
    if (saveToLocalStorage('processos', processos)) {
      alert('Processo cadastrado com sucesso!');
      document.getElementById('form-cadastro').reset();
      // Limpa a mensagem de erro de duplicidade após sucesso
      if(errorNumeroProcesso) errorNumeroProcesso.textContent = ''; 
      showSection('dashboard');
      renderDashboard();
    } else {
      handleError(null, 'Erro ao cadastrar processo.');
    }
  });

  // Listener para cancelar cadastro
  document.getElementById('btn-cancelar-cadastro')?.addEventListener('click', () => {
    document.getElementById('form-cadastro').reset();
    // Garante que a mensagem de erro de duplicidade seja limpa ao cancelar
    if(errorNumeroProcesso) errorNumeroProcesso.textContent = ''; 
    showSection('dashboard');
  });

  // Evento do formulário de alteração
  document.getElementById('btn-buscar-alterar')?.addEventListener('click', () => {
    const numero = document.getElementById('alterar-numero-processo')?.value.trim();
    const processos = loadFromLocalStorage('processos');
    const processo = processos.find(p => p.numero === numero);
    if (processo) {
      document.getElementById('alterar-unidade').value = processo.unidade || '';
      document.getElementById('alterar-prioridade').value = processo.prioridade || '';
      document.getElementById('alterar-origem').value = processo.origem || '';
      document.getElementById('alterar-data-entrada').value = processo.dataEntrada || '';
      document.getElementById('alterar-data-designacao').value = processo.dataDesignacao || '';
      document.getElementById('alterar-data-conclusao').value = processo.dataConclusao || '';
      document.getElementById('alterar-data-saida').value = processo.dataSaida || '';
      document.getElementById('alterar-tipo-demanda').value = processo.tipoDemanda || '';
      document.getElementById('alterar-natureza').value = processo.natureza || '';
      document.getElementById('alterar-ano-pti').value = processo.anoPti || '';
      document.getElementById('alterar-semestre').value = processo.semestre || '';
      document.getElementById('alterar-meta').value = processo.meta || '';
      document.getElementById('alterar-encarregado').value = processo.encarregado || '';
      document.getElementById('alterar-observacoes').value = processo.observacoes || '';
      document.getElementById('form-alteracao').classList.remove('hidden');
    } else {
      alert('Processo não encontrado.');
    }
  });

  document.getElementById('form-alteracao').addEventListener('submit', (e) => {
    e.preventDefault();
    const numero = document.getElementById('alterar-numero-processo')?.value.trim();
    const formData = {
      numero,
      unidade: document.getElementById('alterar-unidade')?.value.trim(),
      prioridade: document.getElementById('alterar-prioridade')?.value,
      origem: document.getElementById('alterar-origem')?.value.trim(),
      dataEntrada: document.getElementById('alterar-data-entrada')?.value,
      dataDesignacao: document.getElementById('alterar-data-designacao')?.value,
      dataConclusao: document.getElementById('alterar-data-conclusao')?.value,
      dataSaida: document.getElementById('alterar-data-saida')?.value,
      tipoDemanda: document.getElementById('alterar-tipo-demanda')?.value,
      natureza: document.getElementById('alterar-natureza')?.value.trim(),
      anoPti: document.getElementById('alterar-ano-pti')?.value.trim(),
      semestre: document.getElementById('alterar-semestre')?.value,
      meta: document.getElementById('alterar-meta')?.value,
      encarregado: document.getElementById('alterar-encarregado')?.value,
      observacoes: document.getElementById('alterar-observacoes')?.value.trim()
    };
    const errorSpans = {
      entrada: document.getElementById('error-alterar-data-entrada'),
      designacao: document.getElementById('error-alterar-data-designacao'),
      conclusao: document.getElementById('error-alterar-data-conclusao'),
      saida: document.getElementById('error-alterar-data-saida')
    };
    const hasError = validarDatas(formData, errorSpans);
    if (hasError) {
      return;
    }
    const processos = loadFromLocalStorage('processos');
    const index = processos.findIndex(p => p.numero === numero);
    if (index !== -1) {
      processos[index] = formData;
      if (saveToLocalStorage('processos', processos)) {
        alert('Processo alterado com sucesso!');
        document.getElementById('form-alteracao').classList.add('hidden');
        document.getElementById('alterar-numero-processo').value = '';
        showSection('listagem');
        renderProcessos();
        renderDashboard();
      } else {
        handleError(null, 'Erro ao alterar processo.');
      }
    } else {
      alert('Processo não encontrado.');
    }
  });

  // Listener para cancelar alteração
  document.getElementById('btn-cancelar-alteracao')?.addEventListener('click', () => {
    document.getElementById('form-alteracao').classList.add('hidden');
    document.getElementById('alterar-numero-processo').value = '';
    showSection('dashboard');
  });

  // Evento do formulário de exportação para Excel
  document.getElementById('form-exportar-excel').addEventListener('submit', (e) => {
    e.preventDefault();
    if (typeof XLSX === 'undefined') {
      handleError(null, 'Erro: Biblioteca de exportação para Excel não carregada. Verifique sua conexão com a internet.');
      showSection('dashboard');
      return;
    }
    const checkboxes = document.querySelectorAll('#form-exportar-excel input[name="campos"]:checked');
    if (checkboxes.length === 0) {
      alert('Selecione pelo menos um campo para exportar.');
      return;
    }
    const fields = Array.from(checkboxes).map(cb => cb.value);
    const processos = loadFromLocalStorage('processos');
    if (processos.length === 0) {
      alert('Nenhum processo para exportar.');
      return;
    }
    const data = processos.map(processo => {
      const row = {};
      fields.forEach(field => {
        row[field] = (field.includes('data') ? formatDate(processo[field]) : processo[field]) || '';
      });
      return row;
    });
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Processos');
      const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processos.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      alert('Arquivo Excel gerado com sucesso!');
      showSection('dashboard');
    } catch (error) {
      handleError(error, 'Erro ao gerar o arquivo Excel.');
      showSection('dashboard');
    }
  });

  // Listener para cancelar exportar
  document.getElementById('btn-cancelar-exportar')?.addEventListener('click', () => {
    showSection('dashboard');
  });

  // Evento do botão gerar backup
  document.getElementById('btn-gerar-backup')?.addEventListener('click', () => {
    const processos = loadFromLocalStorage('processos');
    const blob = new Blob([JSON.stringify(processos)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_processos.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Backup gerado com sucesso!');
    showSection('dashboard');
  });

  // Listener para cancelar backup
  document.getElementById('btn-cancelar-backup')?.addEventListener('click', () => {
    showSection('dashboard');
  });

  // Evento para restaurar backup
  inputRestaurar?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          PROCESSOS_DO_BACKUP_VALIDOS = data; // Armazena para seleção
          renderRestaurarTable(data); // Renderiza a tabela para seleção
        } catch (error) {
          handleError(error, 'Erro ao carregar o backup. Verifique se é um JSON válido.');
        }
      };
      reader.readAsText(file);
    }
  });

  // Função para renderizar tabela de restauração
  function renderRestaurarTable(data) {
    const columns = [
      { key: 'numero' },
      { key: 'unidade' },
      { key: 'prioridade' },
      { key: 'origem' },
      { key: 'dataEntrada', format: formatDate }
    ];
    renderTable('#tabela-restaurar tbody', data, columns, 'selecionar-restaura', data);

    const btnRestaurarSelecionados = document.getElementById('btn-restaurar-selecionados');
    const btnRestaurarTodos = document.getElementById('btn-restaurar-todos');
    const selecionarTodosRestaura = document.getElementById('selecionar-todos-restaura');

    document.querySelectorAll('.selecionar-restaura').forEach(cb => {
      cb.addEventListener('change', () => {
        if (btnRestaurarSelecionados) btnRestaurarSelecionados.disabled = document.querySelectorAll('.selecionar-restaura:checked').length === 0;
      });
    });

    if (selecionarTodosRestaura) {
      selecionarTodosRestaura.addEventListener('change', (e) => {
        document.querySelectorAll('.selecionar-restaura').forEach(cb => cb.checked = e.target.checked);
        if (btnRestaurarSelecionados) btnRestaurarSelecionados.disabled = !e.target.checked && document.querySelectorAll('.selecionar-restaura:checked').length === 0;
      });
    }

    // Listener para restaurar selecionados
    if (btnRestaurarSelecionados) btnRestaurarSelecionados.addEventListener('click', () => {
      const checkboxes = document.querySelectorAll('#tabela-restaurar .selecionar-restaura:checked');
      const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index, 10));
      const selected = indices.map(i => PROCESSOS_DO_BACKUP_VALIDOS[i]);
      restaurarProcessos(selected);
    });

    // Listener para restaurar todos
    if (btnRestaurarTodos) btnRestaurarTodos.addEventListener('click', () => {
      restaurarProcessos(PROCESSOS_DO_BACKUP_VALIDOS, true);
    });
  }

  // Função para restaurar processos (merge ou replace)
  function restaurarProcessos(selected, replaceAll = false) {
    let processos = loadFromLocalStorage('processos', []);
    if (replaceAll) {
      processos = selected;
    } else {
      selected.forEach(sel => {
        const index = processos.findIndex(p => p.numero === sel.numero);
        if (index !== -1) {
          processos[index] = sel; // Update
        } else {
          processos.push(sel); // Add
        }
      });
    }
    if (saveToLocalStorage('processos', processos)) {
      alert('Processos restaurados com sucesso!');
      document.querySelector('#tabela-restaurar tbody').innerHTML = '';
      PROCESSOS_DO_BACKUP_VALIDOS = [];
      renderDashboard();
      showSection('dashboard');
    } else {
      handleError(null, 'Erro ao restaurar processos.');
    }
  }

  // Listener para cancelar restaurar
  document.getElementById('btn-cancelar-restaurar')?.addEventListener('click', () => {
    document.querySelector('#tabela-restaurar tbody').innerHTML = '';
    PROCESSOS_DO_BACKUP_VALIDOS = [];
    showSection('dashboard');
  });

  // Evento do botão enviar email
  const btnEnviarAtividade = document.getElementById('btn-enviar-atividade');
  if (btnEnviarAtividade) btnEnviarAtividade.addEventListener('click', async () => {
    const destinatarioInput = document.getElementById('destinatario');
    const destinatario = destinatarioInput ? destinatarioInput.value : '';
    const checkboxes = document.querySelectorAll('#tabela-envio tbody input[type="checkbox"]:checked');
    
    if (!destinatario || checkboxes.length === 0) {
      alert('Selecione um destinatário e pelo menos um processo.');
      return;
    }

    const processos = loadFromLocalStorage('processos');
    const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index, 10));
    
    const processosValidos = processos.filter(p => 
      p.numero && p.unidade && p.prioridade && p.origem && p.dataEntrada && 
      p.natureza && p.meta && p.encarregado
    );

    let emailBody = 'Você recebeu as seguintes atividades:\n\n';
    let envios = loadFromLocalStorage('envios', []); // Carrega a lista de envios
    const dataEnvio = new Date().toISOString();

    indices.forEach(index => {
      const processo = processosValidos[index];
      if (processo) {
        emailBody += `----------------------------------------\n`;
        emailBody += `Número do Processo: ${processo.numero || ''}\n`;
        emailBody += `Unidade: ${processo.unidade || ''}\n`;
        emailBody += `Data de Entrada: ${formatDate(processo.dataEntrada) || ''}\n`;
        emailBody += `Natureza: ${processo.natureza || ''}\n`;
        emailBody += `META: ${processo.meta || ''}\n\n`;
        
        // Registra o envio no localStorage (Acompanhar)
        envios.push({
          numero: processo.numero,
          destinatario: destinatario,
          dataEnvio: dataEnvio
        });
      }
    });

    if (saveToLocalStorage('envios', envios)) { // Salva o novo registro de envio
      const subject = "Você recebeu nova atividade";
      const mailtoLink = `mailto:${destinatario}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Abre o cliente de e-mail
      window.location.href = mailtoLink;
      
      // Limpa e atualiza a UI após o envio
      if (destinatarioInput) destinatarioInput.value = '';
      const selecionarTodosEnvio = document.getElementById('selecionar-todos-envio');
      if (selecionarTodosEnvio) selecionarTodosEnvio.checked = false;
      // Garante que a lista de envio seja re-renderizada
      renderEnvioAtividade();
    } else {
      handleError(null, 'Erro ao salvar o histórico de envio.');
    }
  });

  // Atualizar botão de enviar email
  function updateEnviarButton() {
    const destinatario = document.getElementById('destinatario')?.value;
    const checkboxes = document.querySelectorAll('#tabela-envio tbody input[type="checkbox"]:checked');
    const btn = document.getElementById('btn-enviar-atividade');
    
    if (btn) btn.disabled = !destinatario || checkboxes.length === 0;
  }

  const destinatarioInput = document.getElementById('destinatario');
  if (destinatarioInput) destinatarioInput.addEventListener('change', updateEnviarButton);

  // Adicione o listener para o botão de apagar processos UMA ÚNICA VEZ
  const btnApagarSelecionados = document.getElementById('btn-apagar-selecionados');
  if (btnApagarSelecionados) btnApagarSelecionados.addEventListener('click', () => {
    const checkboxesMarcados = document.querySelectorAll('#tabela-processos .selecionar-processo:checked');
    
    if (checkboxesMarcados.length === 0) {
      alert('Selecione pelo menos um processo para apagar.');
      return;
    }

    const indicesParaApagar = Array.from(checkboxesMarcados).map(cb => parseInt(cb.dataset.index, 10));

    if (confirm('Deseja realmente apagar os processos selecionados?')) {
      let processosAtuais = loadFromLocalStorage('processos');
      const novosProcessos = processosAtuais.filter((_, index) => !indicesParaApagar.includes(index));

      if (saveToLocalStorage('processos', novosProcessos)) {
        renderProcessos();
        if (btnApagarSelecionados) btnApagarSelecionados.disabled = true;
        const selecionarTodos = document.getElementById('selecionar-todos');
        if (selecionarTodos) selecionarTodos.checked = false;
      } else {
        handleError(null, 'Erro ao apagar os processos.');
      }
    }
  });

  // Renderizar tabela de processos (usando função genérica)
  function renderProcessos() {
    const processos = loadFromLocalStorage('processos');
    const busca = document.getElementById('busca-numero-unidade')?.value.toLowerCase() || '';
    const prioridade = document.getElementById('filtro-prioridade')?.value || '';
    const encarregado = document.getElementById('filtro-encarregado')?.value || '';
    const meta = document.getElementById('filtro-meta')?.value || '';

    const filteredProcessos = processos.filter(p => {
      const numero = (p.numero || '').toLowerCase();
      const unidade = (p.unidade || '').toLowerCase();
      const matchesBusca = numero.includes(busca) || unidade.includes(busca);
      const matchesPrioridade = !prioridade || p.prioridade === prioridade;
      const matchesEncarregado = !encarregado || p.encarregado === encarregado;
      const matchesMeta = !meta || p.meta === meta;
      return matchesBusca && matchesPrioridade && matchesEncarregado && matchesMeta;
    });

    const columns = [
      { key: 'numero' },
      { key: 'unidade' },
      { key: 'prioridade' },
      { key: 'origem' },
      { key: 'dataEntrada', format: formatDate },
      { key: 'dataDesignacao', format: formatDate },
      { key: 'dataConclusao', format: formatDate },
      { key: 'dataSaida', format: formatDate },
      { key: 'tipoDemanda' },
      { key: 'natureza' },
      { key: 'anoPti' },
      { key: 'semestre' },
      { key: 'meta' },
      { key: 'encarregado' },
      { key: 'observacoes' }
    ];

    renderTable('#tabela-processos tbody', filteredProcessos, columns, 'selecionar-processo', processos);

    const selecionarTodosCheckbox = document.getElementById('selecionar-todos');
    const btnApagar = document.getElementById('btn-apagar-selecionados');

    document.querySelectorAll('.selecionar-processo').forEach(cb => {
      cb.addEventListener('change', () => {
        if (btnApagar) btnApagar.disabled = document.querySelectorAll('.selecionar-processo:checked').length === 0;
      });
    });

    if (selecionarTodosCheckbox) {
      selecionarTodosCheckbox.addEventListener('change', (e) => {
        document.querySelectorAll('.selecionar-processo').forEach(cb => cb.checked = e.target.checked);
        if (btnApagar) btnApagar.disabled = !e.target.checked && document.querySelectorAll('.selecionar-processo:checked').length === 0;
      });
    }

    // CHAMA A FUNÇÃO DE SINCRONIZAÇÃO DE SCROLL (PONTO 2)
    // O setTimeout é usado para garantir que o DOM renderize as células da tabela e tenha a largura correta (table.scrollWidth) antes de calcular o sync.
    setTimeout(setupTableScrollSync, 0); 
  }

  // Renderizar tabela de envio de atividade (usando genérica)
  function renderEnvioAtividade() {
    const processos = loadFromLocalStorage('processos');
    const processosValidos = processos.filter(p =>
      p.numero && p.unidade && p.prioridade && p.origem && p.dataEntrada && 
      p.natureza && p.meta && p.encarregado
    );
    const columns = [
      { key: 'numero' },
      { key: 'unidade' },
      { key: 'prioridade' },
      { key: 'origem' },
      { key: 'dataEntrada', format: formatDate },
      { key: 'natureza' },
      { key: 'meta' },
      { key: 'encarregado' }
    ];
    renderTable('#tabela-envio tbody', processosValidos, columns, 'selecionar-envio', processosValidos);

    // RECONECTA LISTENERS
    document.querySelectorAll('.selecionar-envio').forEach(cb => {
      cb.addEventListener('change', updateEnviarButton);
    });

    const selecionarTodosEnvio = document.getElementById('selecionar-todos-envio');
    if (selecionarTodosEnvio) selecionarTodosEnvio.addEventListener('change', (e) => {
      document.querySelectorAll('.selecionar-envio').forEach(cb => cb.checked = e.target.checked);
      updateEnviarButton();
    });
    updateEnviarButton(); 
  }

  // Função para formatar data e hora
  function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  }

  // Renderizar tabela de acompanhamento (usando genérica)
  function renderAcompanhar() {
    const envios = loadFromLocalStorage('envios');
    const processedEnvios = envios.map(envio => {
      const prazo = getRemainingBusinessDays(envio.dataEnvio);
      return {
        ...envio,
        dataEnvio: formatDateTime(envio.dataEnvio),
        prazo: `<span class="${prazo.class}">${prazo.text}</span>`
      };
    });
    const columns = [
      { key: 'numero' },
      { key: 'destinatario' },
      { key: 'dataEnvio' },
      { key: 'prazo', isHTML: true }
    ];
    renderTable('#tabela-acompanhamento tbody', processedEnvios, columns, 'selecionar-acompanhamento', envios);

    const btnApagar = document.getElementById('btn-apagar-acompanhamento');
    const selecionarTodosCheckbox = document.getElementById('selecionar-todos-acompanhamento');

    document.querySelectorAll('.selecionar-acompanhamento').forEach(cb => {
      cb.addEventListener('change', () => {
        if (btnApagar) btnApagar.disabled = document.querySelectorAll('.selecionar-acompanhamento:checked').length === 0;
      });
    });

    if (selecionarTodosCheckbox) {
      selecionarTodosCheckbox.addEventListener('change', (e) => {
        document.querySelectorAll('.selecionar-acompanhamento').forEach(cb => cb.checked = e.target.checked);
        if (btnApagar) btnApagar.disabled = !e.target.checked && document.querySelectorAll('.selecionar-acompanhamento:checked').length === 0;
      });
    }
  }

  // Listener para apagar envios de acompanhamento (adicionado uma única vez)
  const btnApagarAcompanhamento = document.getElementById('btn-apagar-acompanhamento');
  if (btnApagarAcompanhamento) btnApagarAcompanhamento.addEventListener('click', () => {
    const checkboxesMarcados = document.querySelectorAll('#tabela-acompanhamento .selecionar-acompanhamento:checked');
    
    if (checkboxesMarcados.length === 0) {
      alert('Selecione pelo menos um item para apagar.');
      return;
    }

    const indicesParaApagar = Array.from(checkboxesMarcados).map(cb => parseInt(cb.dataset.index, 10));

    if (confirm('Deseja realmente apagar os itens de acompanhamento selecionados?')) {
      let enviosAtuais = loadFromLocalStorage('envios');
      const novosEnvios = enviosAtuais.filter((_, index) => !indicesParaApagar.includes(index));

      if (saveToLocalStorage('envios', novosEnvios)) {
        renderAcompanhar();
        const btnApagar = document.getElementById('btn-apagar-acompanhamento');
        if (btnApagar) btnApagar.disabled = true;
        const selecionarTodosAcompanhamento = document.getElementById('selecionar-todos-acompanhamento');
        if (selecionarTodosAcompanhamento) selecionarTodosAcompanhamento.checked = false;
      } else {
        handleError(null, 'Erro ao apagar os itens.');
      }
    }
  });
  
  // Filtros dinâmicos (com debounce para performance)
  let debounceTimer;
  const filtroInputs = ['busca-numero-unidade', 'filtro-prioridade', 'filtro-encarregado', 'filtro-meta'];
  filtroInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderProcessos, 300);
      });
      input.addEventListener('change', renderProcessos);
    }
  });

  // ==============================================================================
  // 6. INICIALIZAÇÃO DO APLICATIVO: COMEÇA NO LOGIN
  // ==============================================================================
  
  checkDeadlinesOnLoad();
  showSection('login'); 
});
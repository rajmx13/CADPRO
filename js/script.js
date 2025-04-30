document.addEventListener('DOMContentLoaded', () => {
    const sections = {
        cadastro: document.getElementById('cadastro-form'),
        listagem: document.getElementById('listagem-processos'),
        envioAtividade: document.getElementById('envio-atividade'),
        acompanhar: document.getElementById('acompanhar'),
        restauracao: document.getElementById('restauracao-selecao')
    };

    const buttons = {
        cadastrar: document.getElementById('btn-cadastrar'),
        listar: document.getElementById('btn-listar'),
        envioAtividade: document.getElementById('btn-envio-atividade'),
        acompanhar: document.getElementById('btn-acompanhar'),
        exportar: document.getElementById('btn-exportar'),
        backup: document.getElementById('btn-backup'),
        restaurar: document.getElementById('btn-restaurar')
    };

    function showSection(sectionId) {
        Object.values(sections).forEach(section => section.classList.add('hidden'));
        sections[sectionId].classList.remove('hidden');
    }

    // Função para formatar data de aaaa-mm-dd para dd-mm-aaaa
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}-${month}-${year}`;
    }

    // Função para converter dd-mm-aaaa para aaaa-mm-dd (armazenamento)
    function parseDate(dateStr) {
        if (!dateStr) return '';
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
    }

    // Função para formatar data de envio (ISO para dd-mm-aaaa HH:MM)
    function formatDateTime(isoDate) {
        const date = new Date(isoDate);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

    // Função para calcular dias úteis entre duas datas
    function calculateBusinessDays(startDate, endDate) {
        let currentDate = new Date(startDate);
        let businessDays = 0;
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclui domingos (0) e sábados (6)
                businessDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return businessDays;
    }

    // Função para calcular dias úteis restantes
    function getRemainingBusinessDays(dataEnvio) {
        const envioDate = new Date(dataEnvio);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normaliza para comparar apenas datas
        const deadline = new Date(envioDate);
        
        // Avançar 15 dias úteis
        let businessDays = 0;
        while (businessDays < 15) {
            deadline.setDate(deadline.getDate() + 1);
            const dayOfWeek = deadline.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                businessDays++;
            }
        }

        if (today > deadline) {
            return 'PRAZO ESGOTADO';
        }

        const remainingDays = calculateBusinessDays(today, deadline) - 1; // Exclui o dia final
        return `${remainingDays} dias úteis`;
    }

    // Aplicar máscara e validação nos campos de data
    const dateInputs = ['data-entrada', 'data-saida', 'data-entrega-atribuicao'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2);
            if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 9);
            e.target.value = value;
        });
        input.addEventListener('blur', (e) => {
            const value = e.target.value;
            if (value && !/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                alert('Formato de data inválido. Use dd-mm-aaaa.');
                e.target.value = '';
            } else if (value) {
                const [day, month, year] = value.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                if (date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
                    alert('Data inválida.');
                    e.target.value = '';
                }
            }
        });
    });

    buttons.cadastrar.addEventListener('click', () => {
        showSection('cadastro');
        document.getElementById('form-processo').reset();
    });

    buttons.listar.addEventListener('click', () => {
        showSection('listagem');
        renderProcessos();
    });

    buttons.envioAtividade.addEventListener('click', () => {
        showSection('envioAtividade');
        renderEnvioAtividade();
    });

    buttons.acompanhar.addEventListener('click', () => {
        showSection('acompanhar');
        renderAcompanhar();
    });

    buttons.restaurar.addEventListener('click', () => {
        document.getElementById('btn-restaurar-input').click();
    });

    const formProcesso = document.getElementById('form-processo');
    formProcesso.addEventListener('submit', (e) => {
        e.preventDefault();
        const processo = {
            numeroProcesso: document.getElementById('numero-processo').value,
            unidadeParticipante: document.getElementById('unidade-participante').value,
            prioridade: document.getElementById('prioridade').value,
            origem: document.getElementById('origem').value,
            dataEntrada: parseDate(document.getElementById('data-entrada').value),
            dataSaida: parseDate(document.getElementById('data-saida').value),
            natureza: document.getElementById('natureza').value,
            tipoDemanda: document.getElementById('tipo-demanda').value,
            dataEntregaAtribuicao: parseDate(document.getElementById('data-entrega-atribuicao').value),
            anoPti: document.getElementById('ano-pti').value,
            semestre: document.querySelector('input[name="semestre"]:checked')?.value || '',
            meta: document.getElementById('meta').value,
            observacoes: document.getElementById('observacoes').value
        };

        let processos = JSON.parse(localStorage.getItem('processos')) || [];
        processos.push(processo);
        localStorage.setItem('processos', JSON.stringify(processos));
        alert('Processo cadastrado com sucesso!');
        formProcesso.reset();
    });

    function renderProcessos() {
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        const tbody = document.querySelector('#tabela-processos tbody');
        tbody.innerHTML = '';
        processos.forEach((processo, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selecionar-processo" data-index="${index}"></td>
                <td>${processo.numeroProcesso}</td>
                <td>${processo.unidadeParticipante}</td>
                <td>${processo.prioridade}</td>
                <td>${processo.origem}</td>
                <td>${formatDate(processo.dataEntrada)}</td>
                <td>${formatDate(processo.dataSaida)}</td>
                <td>${processo.natureza}</td>
                <td>${processo.tipoDemanda}</td>
                <td>${formatDate(processo.dataEntregaAtribuicao)}</td>
                <td>${processo.anoPti}</td>
                <td>${processo.semestre}</td>
                <td>${processo.meta}</td>
                <td>${processo.observacoes}</td>
            `;
            tbody.appendChild(row);
        });
        updateSelecionarTodos();
    }

    function renderEnvioAtividade() {
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        const tbody = document.querySelector('#tabela-envio-atividade tbody');
        tbody.innerHTML = '';
        processos.forEach((processo, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selecionar-envio" data-index="${index}"></td>
                <td>${processo.numeroProcesso}</td>
                <td>${processo.unidadeParticipante}</td>
                <td>${processo.natureza}</td>
                <td>${processo.meta}</td>
                <td>${formatDate(processo.dataEntregaAtribuicao)}</td>
            `;
            tbody.appendChild(row);
        });
        updateSelecionarTodosEnvio();
        updateEnviarButton();
    }

    function renderAcompanhar() {
        const envios = JSON.parse(localStorage.getItem('envios')) || [];
        const tbody = document.querySelector('#tabela-acompanhar tbody');
        tbody.innerHTML = '';
        envios.forEach((envio) => {
            const prazoRestante = getRemainingBusinessDays(envio.dataEnvio);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${envio.numeroProcesso}</td>
                <td>${envio.emailDestinatario}</td>
                <td>${formatDateTime(envio.dataEnvio)}</td>
                <td class="${prazoRestante === 'PRAZO ESGOTADO' ? 'prazo-esgotado' : ''}">${prazoRestante}</td>
            `;
            tbody.appendChild(row);
        });
    }

    function updateSelecionarTodos() {
        const selecionarTodos = document.getElementById('selecionar-todos');
        const checkboxes = document.querySelectorAll('.selecionar-processo');
        selecionarTodos.addEventListener('change', () => {
            checkboxes.forEach(cb => cb.checked = selecionarTodos.checked);
        });
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                selecionarTodos.checked = Array.from(checkboxes).every(cb => cb.checked);
            });
        });
    }

    function updateSelecionarTodosEnvio() {
        const selecionarTodosEnvio = document.getElementById('selecionar-todos-envio');
        const checkboxesEnvio = document.querySelectorAll('.selecionar-envio');
        selecionarTodosEnvio.addEventListener('change', () => {
            checkboxesEnvio.forEach(cb => cb.checked = selecionarTodosEnvio.checked);
            updateEnviarButton();
        });
        checkboxesEnvio.forEach(cb => {
            cb.addEventListener('change', () => {
                selecionarTodosEnvio.checked = Array.from(checkboxesEnvio).every(cb => cb.checked);
                updateEnviarButton();
            });
        });
    }

    function updateEnviarButton() {
        const emailSelect = document.getElementById('email-destinatario');
        const checkboxesEnvio = document.querySelectorAll('.selecionar-envio:checked');
        const btnEnviar = document.getElementById('btn-enviar-email');
        btnEnviar.disabled = !emailSelect.value || checkboxesEnvio.length === 0;
    }

    document.getElementById('email-destinatario').addEventListener('change', updateEnviarButton);

    document.getElementById('btn-enviar-email').addEventListener('click', () => {
        const emailDestinatario = document.getElementById('email-destinatario').value;
        const checkboxes = document.querySelectorAll('.selecionar-envio:checked');
        const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        const selecionados = processos.filter((_, index) => indices.includes(index));

        const now = new Date();
        const dataEnvio = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
        const horaEnvio = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const assunto = `Nova Atividade - ${dataEnvio} ${horaEnvio}`;

        let corpo = 'Processos Selecionados para Envio\n\n';
        selecionados.forEach((processo, index) => {
            corpo += `Processo ${index + 1}:\n`;
            corpo += `Número do Processo: ${processo.numeroProcesso}\n`;
            corpo += `Unidade Participante: ${processo.unidadeParticipante}\n`;
            corpo += `Natureza: ${processo.natureza}\n`;
            corpo += `META: ${processo.meta}\n`;
            corpo += `Data para a Entrega da Atribuição: ${formatDate(processo.dataEntregaAtribuicao)}\n`;
            corpo += '\n';
        });

        // Registrar envios no localStorage
        let envios = JSON.parse(localStorage.getItem('envios')) || [];
        selecionados.forEach(processo => {
            envios.push({
                numeroProcesso: processo.numeroProcesso,
                emailDestinatario: emailDestinatario,
                dataEnvio: now.toISOString()
            });
        });
        localStorage.setItem('envios', JSON.stringify(envios));

        const mailto = `mailto:${emailDestinatario}?from=agnelo.cordeiro@tcm.ba.gov.br&subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
        console.log('Simulando envio de e-mail:', { from: 'agnelo.cordeiro@tcm.ba.gov.br', to: emailDestinatario, subject: assunto, body: corpo });
        window.location.href = mailto; // Abre o cliente de e-mail padrão
        alert('E-mail preparado para envio! Verifique seu cliente de e-mail.');
    });

    document.getElementById('btn-apagar-selecionados').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.selecionar-processo:checked');
        if (checkboxes.length === 0) {
            alert('Nenhum processo selecionado para apagar.');
            return;
        }
        if (!confirm('Deseja realmente apagar os processos selecionados?')) return;
        const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
        let processos = JSON.parse(localStorage.getItem('processos')) || [];
        processos = processos.filter((_, index) => !indices.includes(index));
        localStorage.setItem('processos', JSON.stringify(processos));
        renderProcessos();
        alert('Processos apagados com sucesso!');
    });

    buttons.exportar.addEventListener('click', () => {
        if (typeof XLSX === 'undefined') {
            alert('Erro: Biblioteca XLSX não carregada. Verifique o arquivo xlsx.full.min.js ou a conexão com a internet.');
            return;
        }

        try {
            const processos = JSON.parse(localStorage.getItem('processos')) || [];
            if (processos.length === 0) {
                alert('Nenhum processo para exportar.');
                return;
            }

            const processosExport = processos.map(processo => ({
                'Número do Processo': String(processo.numeroProcesso || ''),
                'Unidade Participante': String(processo.unidadeParticipante || ''),
                'Prioridade': String(processo.prioridade || ''),
                'Origem': String(processo.origem || ''),
                'Data de Entrada': formatDate(processo.dataEntrada) || '',
                'Data de Saída': formatDate(processo.dataSaida) || '',
                'Natureza': String(processo.natureza || ''),
                'Tipo de Demanda': String(processo.tipoDemanda || ''),
                'Data para a Entrega da Atribuição': formatDate(processo.dataEntregaAtribuicao) || '',
                'ANO PTI': String(processo.anoPti || ''),
                'Semestre': String(processo.semestre || ''),
                'META': String(processo.meta || ''),
                'Observações': String(processo.observacoes || '')
            }));

            const ws = XLSX.utils.json_to_sheet(processosExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Processos');

            // Gerar o arquivo Excel como Blob
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'processos.xlsx';
            a.click();
            URL.revokeObjectURL(url);

            alert('Exportação realizada com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            alert('Erro ao exportar para Excel. Verifique o console para detalhes.');
        }
    });

    buttons.backup.addEventListener('click', () => {
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        const data = JSON.stringify(processos);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup_processos.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('btn-restaurar-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const processos = JSON.parse(event.target.result);
                localStorage.setItem('processos', JSON.stringify(processos));
                showSection('restauracao');
                renderRestauracao();
            };
            reader.readAsText(file);
        }
    });

    function renderRestauracao() {
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        const tbody = document.querySelector('#tabela-restauracao tbody');
        tbody.innerHTML = '';
        processos.forEach((processo, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="selecionar-restauracao" data-index="${index}"></td>
                <td>${processo.numeroProcesso}</td>
                <td>${processo.unidadeParticipante}</td>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('btn-restaurar-selecionados').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.selecionar-restauracao:checked');
        const indices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
        let processos = JSON.parse(localStorage.getItem('processos')) || [];
        const selecionados = processos.filter((_, index) => indices.includes(index));
        processos = JSON.parse(localStorage.getItem('processos')) || [];
        processos.push(...selecionados);
        localStorage.setItem('processos', JSON.stringify(processos));
        alert('Processos restaurados com sucesso!');
        showSection('listagem');
        renderProcessos();
    });

    document.getElementById('btn-restaurar-todos').addEventListener('click', () => {
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        localStorage.setItem('processos', JSON.stringify(processos));
        alert('Todos os processos restaurados com sucesso!');
        showSection('listagem');
        renderProcessos();
    });

    document.getElementById('btn-cancelar-restauracao').addEventListener('click', () => {
        showSection('listagem');
        renderProcessos();
    });

    document.getElementById('btn-cancelar').addEventListener('click', () => {
        showSection('listagem');
        renderProcessos();
    });

    document.getElementById('busca-processos').addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const processos = JSON.parse(localStorage.getItem('processos')) || [];
        const tbody = document.querySelector('#tabela-processos tbody');
        tbody.innerHTML = '';
        processos.forEach((processo, index) => {
            if (processo.numeroProcesso.toLowerCase().includes(termo) || 
                processo.unidadeParticipante.toLowerCase().includes(termo)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="selecionar-processo" data-index="${index}"></td>
                    <td>${processo.numeroProcesso}</td>
                    <td>${processo.unidadeParticipante}</td>
                    <td>${processo.prioridade}</td>
                    <td>${processo.origem}</td>
                    <td>${formatDate(processo.dataEntrada)}</td>
                    <td>${formatDate(processo.dataSaida)}</td>
                    <td>${processo.natureza}</td>
                    <td>${processo.tipoDemanda}</td>
                    <td>${formatDate(processo.dataEntregaAtribuicao)}</td>
                    <td>${processo.anoPti}</td>
                    <td>${processo.semestre}</td>
                    <td>${processo.meta}</td>
                    <td>${processo.observacoes}</td>
                `;
                tbody.appendChild(row);
            }
        });
        updateSelecionarTodos();
    });
});
let dadosProcessos = JSON.parse(localStorage.getItem("processos")) || [];

// Função para alternar entre telas
function toggleSection(sectionId) {
    document.querySelectorAll("section").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");
}

// Eventos dos botões do menu
document.getElementById("btn-cadastrar").addEventListener("click", () => toggleSection("cadastro-form"));
document.getElementById("btn-listar").addEventListener("click", () => {
    toggleSection("listagem-processos");
    carregarTabela();
});

// Salvar formulário
document.getElementById("form-processo").addEventListener("submit", function (e) {
    e.preventDefault();
    const novoProcesso = {
        numeroProcesso: document.getElementById("numero-processo").value,
        unidadeParticipante: document.getElementById("unidade-participante").value,
        prioridade: document.getElementById("prioridade").value,
        origem: document.getElementById("origem").value,
        dataEntrada: document.getElementById("data-entrada").value,
        dataSaida: document.getElementById("data-saida").value,
        natureza: document.getElementById("natureza").value,
        tipoDemanda: document.getElementById("tipo-demanda").value,
        quantidadeDias: document.getElementById("quantidade-dias").value,
        periodoPti: document.getElementById("periodo-pti").value,
        observacoes: document.getElementById("observacoes").value,
    };

    // Form validation
    if (!novoProcesso.numeroProcesso || !novoProcesso.unidadeParticipante || !novoProcesso.prioridade || !novoProcesso.origem || !novoProcesso.dataEntrada) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    dadosProcessos.push(novoProcesso);
    localStorage.setItem("processos", JSON.stringify(dadosProcessos));
    alert("Processo salvo com sucesso!");
    this.reset();
});

// Carregar tabela
function carregarTabela() {
    const tbody = document.querySelector("#tabela-processos tbody");
    tbody.innerHTML = "";
    dadosProcessos.forEach((processo, index) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="checkbox" data-index="${index}"></td>
            <td>${processo.numeroProcesso}</td>
            <td>${processo.unidadeParticipante}</td>
            <td>${processo.prioridade}</td>
            <td>${processo.origem}</td>
            <td>${processo.dataEntrada}</td>
            <td>${processo.dataSaida}</td>
            <td>${processo.natureza}</td>
            <td>${processo.tipoDemanda}</td>
            <td>${processo.quantidadeDias}</td>
            <td>${processo.periodoPti}</td>
            <td>${processo.observacoes}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Apagar selecionados
document.getElementById("btn-apagar-selecionados").addEventListener("click", () => {
    const checkboxes = document.querySelectorAll("#tabela-processos tbody input[type='checkbox']:checked");
    if (checkboxes.length === 0) {
        alert("Nenhum processo selecionado.");
        return;
    }
    const indices = Array.from(checkboxes).map(cb => cb.dataset.index);
    dadosProcessos = dadosProcessos.filter((_, index) => !indices.includes(index.toString()));
    localStorage.setItem("processos", JSON.stringify(dadosProcessos));
    carregarTabela();
    alert("Processos apagados com sucesso!");
});

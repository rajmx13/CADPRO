document.addEventListener('DOMContentLoaded', () => {
    // Função para gerar o PDF
    function generateManualPDF() {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            console.error('Biblioteca jsPDF não carregada.');
            alert('Erro: Biblioteca de exportação para PDF não carregada. Verifique sua conexão com a internet.');
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Configurações de formatação
        const margin = 10;
        let y = margin;
        const pageHeight = doc.internal.pageSize.height;
        const maxWidth = 190; // Largura máxima do texto (A4 menos margens)

        // Função para adicionar texto com quebra de página
        function addText(text, x, y, size, style = 'normal', bgColor = null) {
            doc.setFontSize(size);
            doc.setFont('helvetica', style);
            if (bgColor) {
                doc.setFillColor(...bgColor);
                doc.rect(x - 2, y - 2, maxWidth + 4, size + 2, 'F');
            }
            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                if (y + size > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, x, y);
                y += size * 0.6;
            });
            return y;
        }

        // Conteúdo do manual
        const manualContent = `
# Manual do Gerenciador de Processos - Versão 1.52

## Introdução
O **Gerenciador de Processos** é um aplicativo web simples para gerenciar processos administrativos. Ele permite cadastrar, listar, alterar, enviar e acompanhar processos, além de exportar dados para Excel ou PDF e fazer backup/restauração. Este manual é voltado para usuários iniciantes, com passos detalhados e descrições de telas (*prints*) para facilitar o uso.

**Versão**: 1.52 (30 de julho de 2025)

**O que você precisa**:
- Um navegador (Google Chrome ou Firefox recomendado).
- Conexão com a internet para carregar gráficos e exportações.
- Uma pasta C:\\CadPro\\Dados no seu computador para backups (crie-a se não existir).

**Dica para iniciantes**: Sempre faça backup antes de fechar o aplicativo para proteger seus dados. Use o menu superior para navegar entre as funções.

*Print 1: Tela inicial do aplicativo, com o título "Gerenciador de Processos" em azul, duas imagens (uma tartaruga à esquerda e um tribunal à direita), menu superior com botões "Cadastrar Processo", "Listar Processos", "Alterar Processo", "Envio de Atividade", "Acompanhar", "Manutenção" e "Sair" em azul, e dois gráficos: "Processos por Prioridade" (barras laranja, azul e cinza para Alta, Média, Baixa) e "Processos por Encarregado" (barras azuis com nomes como "Luana Alice"). No rodapé, "Versão: 1.52".*

## Estrutura de Arquivos
O aplicativo funciona com os seguintes arquivos:
/root
  ├── index.html
  ├── css/
  │   └── styles.css
  ├── js/
  │   └── script.js
  │   └── generate_manual_pdf.js
  ├── docs/
  │   └── Novidades da versão 1.52.md
  │   └── Manual do Gerenciador de Processos v1.52.md

## Funcionalidades

### 1. Dashboard Inicial
O **Dashboard** é a tela inicial, mostrando gráficos para entender rapidamente quantos processos estão em cada prioridade e com cada responsável.

**Como usar**:
1. Abra o aplicativo no navegador. Você verá o Dashboard automaticamente.
2. Veja os gráficos:
   - **Processos por Prioridade**: Mostra quantos processos são "Alta", "Média" ou "Baixa".
   - **Processos por Encarregado**: Mostra quantos processos cada pessoa (ex.: Luana Alice) está gerenciando.
3. Clique em um botão do menu superior (ex.: "Cadastrar Processo") para ir a outra função.

**Dica**: Se os gráficos não aparecerem, verifique sua conexão com a internet. Eles dependem da biblioteca Chart.js.

*Print 2: Tela do Dashboard com título "Dashboard" em azul, dois gráficos em caixas brancas: à esquerda, barras coloridas (laranja, azul, cinza) com "Alta: 3, Média: 2, Baixa: 1"; à direita, barras azuis com "Luana Alice: 4, José Vilebaldo: 2". O menu superior está visível, e o rodapé mostra "Versão: 1.52".*

### 2. Cadastrar Processo
Cadastre um novo processo com informações como número, unidade e prioridade.

**Como usar**:
1. Clique em **Cadastrar Processo** no menu superior.
2. Preencha os campos obrigatórios (marcados com *):
   - *Número do Processo*: Digite no formato 12345e25 (ex.: 54321e25).
   - *Unidade Participante*: Digite a unidade (ex.: Secretaria de Finanças).
   - *Prioridade*: Escolha Alta, Média ou Baixa no menu suspenso.
   - *Origem*: Digite a origem (ex.: TCM/BA).
   - *Data de Entrada*: Digite no formato dd-mm-aaaa (ex.: 01-08-2025).
   - *Tipo de Demanda*: Escolha Interna ou Externa.
   - *Encarregado da Elaboração*: Escolha um nome (ex.: José Vilebaldo).
3. Preencha campos opcionais, como Data de Designação, Data de Conclusão, Data de Saída, Natureza, Ano PTI, Semestre, META e Observações.
4. Clique em **Salvar**. Você verá um alerta "Processo cadastrado com sucesso!".
5. Se quiser voltar sem salvar, clique em **Cancelar**.

**Dica para iniciantes**: 
- O número do processo deve ter 5 números, a letra "e" e 2 números (ex.: 12345e25).
- As datas devem estar na ordem: Entrada antes de Designação, Conclusão e Saída. Se houver erro, uma mensagem aparecerá abaixo do campo.

*Print 3: Tela de cadastro com título "Cadastro de Atividades", campos preenchidos (ex.: Número do Processo: 54321e25, Unidade: Secretaria de Finanças, Prioridade: Alta, Data de Entrada: 01-08-2025), botão "Salvar" em azul e "Cancelar" em cinza ao lado. Uma mensagem de erro vermelha abaixo de "Data de Conclusão" diz "Data de Conclusão não pode ser anterior à Data de Entrada".*

### 3. Listar Processos
Veja todos os processos em uma tabela e use filtros para encontrar processos específicos.

**Como usar**:
1. Clique em **Listar Processos** no menu superior.
2. Use os filtros para refinar a busca:
   - **Buscar por Número ou Unidade**: Digite parte do número ou unidade (ex.: 543 ou Finanças).
   - **Filtrar por Prioridade**: Escolha Alta, Média ou Baixa.
   - **Filtrar por Encarregado**: Escolha um responsável (ex.: José Vilebaldo).
   - **Filtrar por META**: Escolha uma meta (ex.: Meta 1).
3. A tabela mostra os processos filtrados, com colunas como Número, Unidade, Prioridade, etc.
4. Para apagar processos:
   - Marque os checkboxes na primeira coluna da tabela.
   - Clique em **Apagar Selecionados**.
   - Confirme no alerta que aparecer.
5. Use o checkbox "Selecionar Todos" no cabeçalho da tabela para marcar todos os processos.

**Dica para iniciantes**: Os filtros são aplicados automaticamente ao digitar ou selecionar. Se a tabela estiver vazia, verifique se os filtros estão muito restritivos.

*Print 4: Tela de listagem com título "Listagem de Processos", campo de busca com "543" digitado, filtro de Prioridade com "Alta" selecionado, tabela com 3 processos (ex.: 54321e25, Secretaria de Finanças, Alta), dois checkboxes marcados, botão "Apagar Selecionados" em vermelho abaixo.*

### 4. Alterar Processo
Edite as informações de um processo já cadastrado.

**Como usar**:
1. Clique em **Alterar Processo** no menu superior.
2. Digite o número do processo (ex.: 54321e25) no campo "Número do Processo".
3. Clique em **Buscar**. Os dados do processo aparecerão no formulário.
4. Edite os campos desejados (o número do processo não pode ser mudado).
5. Clique em **Salvar Alterações**. Um alerta confirmará "Processo alterado com sucesso!".
6. Clique em **Cancelar** para voltar sem salvar.

**Dica para iniciantes**: Se o processo não for encontrado, um alerta dirá "Processo não encontrado". Verifique o número na tela de listagem.

*Print 5: Tela de alteração com título "Alterar Processo", campo "Número do Processo" com "54321e25", botão "Buscar" em azul, formulário preenchido (ex.: Unidade: Secretaria de Finanças, Prioridade: Média), botões "Salvar Alterações" em azul e "Cancelar" em cinza.*

### 5. Envio de Atividade
Envie processos por e-mail para acompanhamento.

**Como usar**:
1. Clique em **Envio de Atividade** no menu superior.
2. Escolha um e-mail no campo "Destinatário" (ex.: agnelo.cordeiro@tcm.ba.gov.br).
3. Marque os checkboxes dos processos na tabela.
4. Clique em **Enviar**. Seu programa de e-mail (ex.: Outlook) abrirá com os dados dos processos.
5. Envie o e-mail pelo seu programa.

**Dica para iniciantes**: O botão "Enviar" só fica ativo se você selecionar um e-mail e pelo menos um processo.

*Print 6: Tela de envio com título "Envio de Atividade", campo "Destinatário" com "agnelo.cordeiro@tcm.ba.gov.br", tabela com 4 processos, dois checkboxes marcados, botão "Enviar" em azul ativo.*

### 6. Acompanhar
Veja o status dos processos enviados, incluindo prazos.

**Como usar**:
1. Clique em **Acompanhar** no menu superior.
2. A tabela mostra:
   - Número do processo.
   - E-mail do destinatário.
   - Data e hora do envio.
   - Prazo restante (15 dias úteis a partir do envio).
3. Prazos são coloridos:
   - Vermelho: Prazo esgotado.
   - Laranja: 2 dias úteis ou menos.

**Dica para iniciantes**: Ao abrir o aplicativo, alertas mostram processos com prazos vencidos ou próximos de vencer.

*Print 7: Tela de acompanhamento com título "Acompanhar", tabela com 3 processos (ex.: 54321e25, agnelo.cordeiro@tcm.ba.gov.br, 01-08-2025 10:30, "PRAZO ESGOTADO" em vermelho; outro com "1 dia útil" em laranja).*

### 7. Manutenção
Acesse ferramentas extras em **Manutenção** no menu superior. Clique no botão para abrir um submenu com Exportar para Excel, Exportar para PDF, Backup e Restaurar.

*Print 8: Menu superior com "Manutenção" clicado, submenu aberto com opções "Exportar para Excel", "Exportar para PDF", "Backup" e "Restaurar".*

#### 7.1 Exportar para Excel
Crie um arquivo Excel com os dados dos processos.

**Como usar**:
1. Clique em **Manutenção > Exportar para Excel**.
2. Marque os checkboxes dos campos que deseja incluir (ex.: Número do Processo, Prioridade).
3. Clique em **Exportar**. O arquivo processos.xlsx será baixado.
4. Um alerta dirá "Arquivo Excel gerado com sucesso!".
5. Clique em **Cancelar** para voltar.

**Dica para iniciantes**: Selecione pelo menos um campo, e deve haver processos cadastrados.

*Print 9: Tela de exportação com título "Exportar para Excel", checkboxes marcados (ex.: Número do Processo, Prioridade, Data de Entrada), botão "Exportar" em azul, "Cancelar" em cinza.*

#### 7.2 Exportar para PDF
Crie um arquivo PDF com os processos.

**Como usar**:
1. Clique in **Manutenção > Exportar para PDF**.
2. O arquivo relatorio_processos.pdf será baixado automaticamente.
3. Um alerta dirá "PDF gerado com sucesso!".

**Dica para iniciantes**: O PDF inclui número, unidade, prioridade, origem e data de entrada.

*Print 10: Alerta na tela com texto "PDF gerado com sucesso!" e botão "OK".*

#### 7.3 Backup
Salve todos os processos em um arquivo JSON.

**Como usar**:
1. Clique em **Manutenção > Backup**.
2. Um alerta dirá "Backup gerado. Salve o arquivo em C:\\CadPro\\Dados".
3. Salve o arquivo (ex.: backup_processos_2025-08-11T14-30-00.json) na pasta C:\\CadPro\\Dados.

**Dica para iniciantes**: Crie a pasta C:\\CadPro\\Dados antes de salvar.

*Print 11: Janela de download do navegador mostrando "backup_processos_2025-08-11T14-30-00.json", com opção "Salvar como" apontando para C:\\CadPro\\Dados.*

#### 7.4 Restaurar
Importe processos de um arquivo JSON.

**Como usar**:
1. Clique em **Manutenção > Restaurar**.
2. Um alerta dirá "Selecione o arquivo de backup em C:\\CadPro\\Dados".
3. Escolha o arquivo JSON na pasta C:\\CadPro\\Dados.
4. Na tabela, marque os processos que deseja importar.
5. Clique em **Restaurar Selecionados** ou **Restaurar Todos**.
6. Clique em **Cancelar** para voltar.

**Dica para iniciantes**: Processos com números já existentes não serão importados.

*Print 12: Tela de restauração com título "Restauração de Processos", tabela com 3 processos do backup, dois checkboxes marcados, botões "Restaurar Selecionados", "Restaurar Todos" e "Cancelar".*

### 8. Sair
Feche o aplicativo com segurança.

**Como usar**:
1. Clique em **Sair** no menu superior.
2. Um alerta pergunta "O BACKUP JÁ FOI FEITO?".
3. Clique em **SIM** para fechar o aplicativo.
4. Clique in **NÃO** para voltar.

**Dica para iniciantes**: Sempre faça backup antes de sair.

*Print 13: Tela de saída com título "Sair do Sistema", mensagem "O BACKUP JÁ FOI FEITO?" em vermelho, botões "SIM" em vermelho e "NÃO" em azul.*

## Solução de Problemas
- **Erro ao exportar Excel/PDF**: Verifique a conexão com a internet. Abra o console do navegador (F12 > Console) para detalhes.
- **Backup/Restauração não funciona**: Confirme que a pasta C:\\CadPro\\Dados existe e que o arquivo JSON é válido.
- **Tabela vazia na listagem**: Ajuste ou limpe os filtros.
- **Botões não respondem**: Verifique se todos os campos obrigatórios estão preenchidos.
- **Aplicativo não abre**: Certifique-se de que os arquivos index.html, styles.css e script.js estão na pasta correta.

## Novidades da Versão 1.52
- Filtros na tela de listagem reorganizados (Prioridade em uma linha separada).
- Pasta C:\\CadPro\\Dados padronizada para backup e restauração.
- Correção de erro na exportação para Excel (arquivo agora gera corretamente).
- Correção na exportação para PDF, com alerta de sucesso.
- Melhorias em mensagens de erro e alertas.

## Suporte
Para dúvidas, envie um e-mail para agnelo.cordeiro@tcm.ba.gov.br.
`;

        // Processar o conteúdo linha por linha
        const lines = manualContent.split('\n');
        lines.forEach(line => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            if (line.startsWith('# ')) {
                y = addText(line.replace('# ', ''), margin, y, 16, 'bold');
            } else if (line.startsWith('## ')) {
                y = addText(line.replace('## ', ''), margin, y, 14, 'bold');
            } else if (line.startsWith('### ')) {
                y = addText(line.replace('### ', ''), margin, y, 12, 'bold');
            } else if (line.startsWith('*Print')) {
                y = addText(line.replace('*', ''), margin + 5, y, 10, 'italic', [240, 240, 240]);
            } else if (line.startsWith('- ')) {
                y = addText(line.replace('- ', '• '), margin + 5, y, 10);
            } else if (line.startsWith('1. ') || line.match(/^\d+\. /)) {
                y = addText(line, margin + 5, y, 10);
            } else if (line.trim().startsWith('```')) {
                // Ignorar blocos de código por enquanto
                return;
            } else if (line.trim()) {
                y = addText(line, margin, y, 10);
            } else {
                y += 5; // Espaço entre parágrafos
            }
        });

        // Salvar o PDF
        doc.save('Manual_Gerenciador_Processos_v1.52.pdf');
        alert('PDF do manual gerado com sucesso!');
    }

    // Adicionar botão para gerar o PDF (opcional, para integração no aplicativo)
    const btnGeneratePDF = document.createElement('button');
    btnGeneratePDF.textContent = 'Gerar Manual em PDF';
    btnGeneratePDF.style.margin = '10px';
    btnGeneratePDF.addEventListener('click', generateManualPDF);
    document.body.appendChild(btnGeneratePDF);

    // Exportar a função para uso no script.js
    window.generateManualPDF = generateManualPDF;
});
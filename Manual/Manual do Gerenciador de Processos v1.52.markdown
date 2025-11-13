# Manual do Gerenciador de Processos - Versão 1.52

## Introdução
O **Gerenciador de Processos** é um aplicativo web para cadastro, listagem, alteração, envio, acompanhamento, exportação e backup/restauração de processos administrativos. Esta versão (1.52) inclui melhorias na interface, exportação de dados e padronização de pastas.

**Data da Versão**: 30 de julho de 2025

## Requisitos
- Navegador moderno (ex.: Google Chrome, Firefox).
- Conexão com a internet para carregar bibliotecas Chart.js, SheetJS (XLSX) e jsPDF via CDN.
- Recomenda-se realizar um backup antes de atualizar para a versão 1.52.

## Estrutura de Arquivos
```
/root
  ├── index.html
  ├── css/
  │   └── styles.css
  ├── js/
  │   └── script.js
  ├── docs/
  │   └── Novidades da versão 1.52.md
  │   └── Manual do Gerenciador de Processos v1.52.md
```

## Funcionalidades

### 1. Dashboard
- **Acesso**: Ao abrir o aplicativo, a tela inicial exibe o **Dashboard**.
- **Funcionalidade**: Mostra gráficos de barras com:
  - Quantidade de processos por prioridade (Alta, Média, Baixa).
  - Quantidade de processos por encarregado de elaboração.
- **Uso**: Visualize a distribuição de processos para análise rápida.

### 2. Cadastro de Processos
- **Acesso**: Clique em **Cadastrar** no menu lateral.
- **Campos Obrigatórios**:
  - **Número do Processo**: Formato `12345e25` (5 dígitos, "e", 2 dígitos).
  - **Unidade Participante**, **Prioridade**, **Origem**, **Data de Entrada**, **Tipo de Demanda**, **Encarregado da Elaboração**.
- **Campos Opcionais**:
  - **Data de Designação**, **Data de Conclusão**, **Data de Saída**, **Natureza**, **Ano PTI**, **Semestre**, **META**, **Observações**.
- **Validações**:
  - O número do processo deve ser único e seguir o formato especificado.
  - As datas devem seguir a ordem: Entrada ≤ Designação ≤ Conclusão ≤ Saída.
  - Formato de data: `dd-mm-aaaa` (ex.: `30-07-2025`).
- **Ações**:
  - Clique em **Cadastrar** para salvar.
  - Clique em **Cancelar** para voltar à listagem sem salvar.
- **Dica**: Preencha todos os campos obrigatórios antes de salvar. Erros de validação são exibidos abaixo dos campos de data.

### 3. Listagem de Processos
- **Acesso**: Clique em **Listar** no menu lateral.
- **Funcionalidade**: Exibe uma tabela com todos os processos cadastrados.
- **Filtros**:
  - **Buscar por Número ou Unidade**: Digite parte do número do processo ou unidade participante (ex.: `123` ou `Financeiro`).
  - **Filtrar por Prioridade**: Selecione Alta, Média ou Baixa.
  - **Filtrar por Encarregado**: Selecione um encarregado.
  - **Filtrar por META**: Selecione uma meta.
- **Ações**:
  - **Selecionar Todos**: Marque o checkbox na primeira coluna do cabeçalho para selecionar todos os processos exibidos.
  - **Apagar Selecionados**: Clique em **Apagar Selecionados** para remover os processos marcados (confirmação necessária).
- **Nota**: O campo "Filtrar por Prioridade" está em uma linha abaixo de "Buscar por Número ou Unidade" para melhor organização.

### 4. Alteração de Processos
- **Acesso**: Clique em **Alterar** no menu lateral.
- **Passos**:
  1. Insira o número do processo (formato `12345e25`) no campo de busca.
  2. Clique em **Buscar** para carregar os dados do processo.
  3. Edite os campos desejados.
  4. Clique em **Alterar** para salvar ou **Cancelar** para voltar à listagem.
- **Validações**:
  - Mesmas validações do cadastro (campos obrigatórios, formato do número, ordem das datas).
- **Dica**: Certifique-se de que o número do processo existe antes de buscar.

### 5. Envio de Atividades
- **Acesso**: Clique em **Envio de Atividade** no menu lateral.
- **Funcionalidade**: Permite enviar processos por e-mail para acompanhamento.
- **Passos**:
  1. Selecione os processos na tabela (checkbox na primeira coluna).
  2. Insira o e-mail do destinatário.
  3. Clique em **Enviar** para abrir o cliente de e-mail com os dados dos processos.
- **Validações**:
  - Pelo menos um processo deve ser selecionado.
  - O campo de e-mail não pode estar vazio.
- **Nota**: O envio abre o cliente de e-mail padrão (ex.: Outlook) com um corpo contendo número do processo, unidade, natureza, meta e encarregado.

### 6. Acompanhamento
- **Acesso**: Clique em **Acompanhar** no menu lateral.
- **Funcionalidade**: Exibe uma tabela com processos enviados, incluindo:
  - Número do processo.
  - E-mail do destinatário.
  - Data e hora do envio.
  - Dias úteis restantes (15 dias úteis a partir do envio).
- **Alertas**:
  - **Prazo Esgotado**: Exibido em vermelho se o prazo de 15 dias úteis foi excedido.
  - **Aviso**: Exibido em amarelo se restarem 2 dias úteis ou menos.
- **Dica**: Alertas de prazos são exibidos automaticamente ao abrir o aplicativo.

### 7. Exportação para Excel
- **Acesso**: Clique em **Manutenção > Exportar para Excel** no menu lateral.
- **Passos**:
  1. Selecione os campos a exportar (ex.: Número do Processo, Prioridade, etc.).
  2. Clique em **Exportar** para baixar o arquivo `processos.xlsx`.
  3. Clique em **Cancelar** para voltar à listagem.
- **Validações**:
  - Pelo menos um campo deve ser selecionado.
  - Deve haver processos cadastrados.
- **Nota**: O arquivo Excel é gerado com os campos selecionados e formatado adequadamente. Requer conexão com a internet para carregar a biblioteca SheetJS.

### 8. Exportação para PDF
- **Acesso**: Clique em **Manutenção > Exportar para PDF** no menu lateral.
- **Funcionalidade**: Gera um arquivo `relatorio_processos.pdf` com número do processo, unidade, prioridade, origem e data de entrada.
- **Nota**: Requer conexão com a internet para carregar a biblioteca jsPDF. O PDF é gerado automaticamente e baixado.

### 9. Backup
- **Acesso**: Clique em **Manutenção > Backup** no menu lateral.
- **Funcionalidade**: Gera um arquivo JSON com todos os processos cadastrados.
- **Passos**:
  1. Clique em **Backup**.
  2. Salve o arquivo manualmente na pasta `C:\CadPro\Dados` (o nome sugerido inclui um timestamp, ex.: `backup_processos_2025-07-30T17-56-00.json`).
- **Nota**: Deve haver processos cadastrados para gerar o backup.

### 10. Restauração
- **Acesso**: Clique em **Manutenção > Restaurar** no menu lateral.
- **Passos**:
  1. Um alerta solicita selecionar o arquivo de backup em `C:\CadPro\Dados`.
  2. Escolha o arquivo JSON de backup.
  3. Na tela de restauração, selecione os processos a restaurar (ou clique em **Restaurar Todos**).
  4. Clique em **Restaurar Selecionados** ou **Restaurar Todos** para importar os processos.
  5. Clique em **Cancelar** para voltar à listagem.
- **Validações**:
  - O arquivo deve ser um JSON válido.
  - O tamanho do arquivo não pode exceder 50MB.
  - Processos com números duplicados não são importados.
- **Nota**: A restauração adiciona novos processos sem sobrescrever os existentes.

### 11. Sair
- **Acesso**: Clique em **Sair** no menu lateral.
- **Funcionalidade**: Exibe uma tela de confirmação.
- **Ações**:
  - Clique em **Sim** para fechar o aplicativo.
  - Clique em **Não** para voltar à tela anterior.

## Novidades da Versão 1.52
- **Filtros na Listagem**: Campo "Filtrar por Prioridade" movido para uma linha abaixo de "Buscar por Número ou Unidade".
- **Pasta de Backup/Restauração**: Padronizada para `C:\CadPro\Dados`, com alertas orientando o usuário.
- **Exportação para Excel**:
  - Corrigido erro `TypeError: Cannot set properties of undefined (setting 'undefined')`.
  - Adicionado alerta de sucesso após a geração do arquivo.
- **Exportação para PDF**:
  - Corrigido problema de não geração do PDF.
  - Adicionado alerta de sucesso.
- **Outras Melhorias**:
  - Tratamento robusto de erros em exportações e restaurações.
  - Valores padrão (`''`) para campos indefinidos, evitando erros.
  - Timestamp nos nomes dos arquivos de backup.

## Solução de Problemas
- **Erro ao exportar para Excel/PDF**:
  - Verifique a conexão com a internet (CDNs das bibliotecas SheetJS/jsPDF).
  - Abra o console do navegador (F12 > Console) para detalhes do erro.
  - Tente um CDN alternativo para SheetJS: `https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js`.
- **Backup/Restauração**:
  - Certifique-se de salvar/selecionar arquivos em `C:\CadPro\Dados`.
  - Arquivos JSON inválidos ou maiores que 50MB causam erro.
- **Filtros não funcionam**:
  - Confirme que os filtros estão preenchidos corretamente (ex.: prioridade exata, como "Alta").
- **Aplicativo não carrega**:
  - Verifique se todos os arquivos (`index.html`, `styles.css`, `script.js`) estão na estrutura correta.
  - Teste em outro navegador.

## Notas
- O aplicativo usa o `localStorage` do navegador para armazenar processos e envios.
- As bibliotecas Chart.js, SheetJS e jsPDF são carregadas via CDN, exigindo conexão com a internet.
- Para automação de backup/restauração (ex.: salvar diretamente em `C:\CadPro\Dados`), contate o suporte para uma versão desktop usando Node.js/Electron.
- Faça backup regularmente para evitar perda de dados.

## Suporte
Para dúvidas ou problemas, contate o desenvolvedor via e-mail: agnelo.cordeiro@tcm.ba.gov.br.
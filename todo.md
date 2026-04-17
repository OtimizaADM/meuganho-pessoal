# Meu Ganho Pessoal - TODO

## Backend / Banco de Dados
- [x] Schema: tabela `incomes` (receitas)
- [x] Schema: tabela `expenses` (despesas)
- [x] Schema: tabela `credit_cards` (cartões de crédito)
- [x] Schema: tabela `credit_card_transactions` (lançamentos de cartão)
- [x] Schema: tabela `installment_purchases` (compras parceladas)
- [x] Schema: tabela `expense_categories` (categorias de despesas)
- [x] Migração do banco de dados (`pnpm db:push`)
- [x] API: CRUD de receitas
- [x] API: CRUD de despesas
- [x] API: CRUD de cartões de crédito
- [x] API: CRUD de lançamentos de cartão
- [x] API: CRUD de compras parceladas (com geração automática de parcelas)
- [x] API: CRUD de categorias de despesas
- [x] API: Resumo financeiro mensal (dashboard)
- [x] API: Dados para gráficos (evolução mensal, distribuição por categoria)

## Frontend / UI
- [x] Design system: paleta de cores elegante, tipografia, tokens CSS
- [x] DashboardLayout com sidebar e navegação
- [x] Página: Dashboard (visão geral do mês)
- [x] Página: Receitas (listagem, cadastro, edição, exclusão)
- [x] Página: Despesas (listagem, cadastro, edição, exclusão)
- [x] Página: Cartão de Crédito (listagem de cartões, faturas mensais)
- [x] Página: Parcelamentos (listagem, cadastro, visualização de parcelas)
- [x] Página: Relatórios (gráficos de evolução, distribuição por categoria)
- [x] Componente: Filtro por período (mês/ano)
- [x] Componente: Cards de resumo financeiro
- [x] Componente: Gráficos com Recharts
- [x] Responsividade mobile

## Qualidade
- [x] Testes vitest para rotas principais (15 testes passando)
- [ ] Documentação do projeto (DOCS.md)

## Exportação de Relatórios
- [x] Instalar dependências: exceljs (Excel) e jspdf + jspdf-autotable (PDF)
- [x] Endpoint REST /api/export/excel?month=YYYY-MM — gera planilha Excel com abas por categoria
- [x] Endpoint REST /api/export/pdf?month=YYYY-MM — gera PDF com layout de extrato financeiro
- [x] Botões de exportação na página de Relatórios (PDF e Excel)
- [x] Feedback visual de loading durante geração do arquivo

## Melhorias v1.2
- [x] Schema: tabela `recurringItems` (receitas/despesas fixas com conta bancária)
- [x] Schema: tabela `goals` (metas mensais e anuais)
- [x] Schema: adicionar `isPaid`, `paidAt`, `paymentMethod` em `expenses`
- [x] Schema: adicionar `dueDayOfMonth` em `creditCards` para alerta de vencimento
- [x] Novas categorias padrão: Telefonia, Streamings, Assinaturas, Pets, Academia
- [x] Página Recorrentes: listar, cadastrar, editar e excluir receitas/despesas fixas com conta bancária
- [x] Metas mensais: limite por categoria com barra de progresso e alerta visual ≥80%
- [x] Metas anuais: objetivo com valor-alvo, valor atual e prazo
- [x] Dashboard: widget de metas mensais e alerta de fatura próxima do vencimento
- [x] Despesas: campo isPaid, paymentMethod (cartão, pix, dinheiro, débito, transferência)
- [x] Testes Vitest para novas funcionalidades (24 testes passando)

## Melhorias v1.3 - Dashboard
- [x] Backend: corrigir getMonthlySummary para somar receitas/despesas recorrentes no mês vigente
- [x] Backend: nova query getNextPayments (próximos 3 pagamentos com data e tipo)
- [x] Backend: nova query getFutureCommitments (compromissos do próximo mês: cartão, parcelamentos, fixas)
- [x] Dashboard: cards de saldo vigente separado de compromissos futuros
- [x] Dashboard: seção "Compromissos Futuros" com breakdown por cartão, parcelamentos e fixas
- [x] Dashboard: widget "Próximos Pagamentos" com 3 itens e datas de vencimento

## Correções v1.4 - Dashboard Despesas
- [x] Backend: getMonthlySummary retornar totalDespesasReal (avulsas + cartão + fixas) e breakdown por tipo
- [x] Backend: retornar paidAmount e pendingAmount dentro das despesas avulsas
- [x] Dashboard: card Despesas mostra total consolidado correto com sublabel pago/em aberto
- [x] Dashboard: card Despesas expansível com detalhamento por tipo (avulsas, cartão, parcelamentos, fixas)

## Correções v1.5 - Cartão de Crédito
- [x] Corrigir formatação de datas nos lançamentos (undefined/undefined/)
- [x] Adicionar campo tipo crédito/débito no schema creditCardTransactions
- [x] Débito: marcar automaticamente como pago e lançar no mês vigente
- [x] Crédito: calcular mês da fatura com base no dia de fechamento do cartão
- [x] Exibir badge de tipo (Crédito/Débito) na listagem de lançamentos

## Melhorias v1.6 - Cartão: Recorrentes + Reorganização Visual
- [x] Backend: recorrentes vinculadas a cartão (paymentType=credit) entram na fatura mensal como assinaturas
- [x] Backend: query de fatura separar os 4 tipos: assinaturas fixas, esporádicas, parcelamentos, débito automático
- [x] Página Cartão: seção "Assinaturas Fixas" (recorrentes vinculadas ao cartão)
- [x] Página Cartão: seção "Despesas Esporádicas" (lançamentos avulsos de crédito)
- [x] Página Cartão: seção "Parcelamentos" (parcelas do mês)
- [x] Página Cartão: seção "Débito Automático" (lançamentos de débito)
- [x] Página Cartão: card de resumo com total por seção e total geral da fatura
- [x] Página Recorrentes: campo de seleção de cartão quando paymentType=credit

## Melhorias v1.7 - Dashboard Redesign
- [x] Backend: getMonthlySummary incluir assinaturas recorrentes no totalCartao
- [x] Backend: retornar breakdown À Vista (fixas + avulsas pix/dinheiro/débito) e Crédito (parcelamentos + assinaturas + avulsas cartão)
- [x] Dashboard: card Despesas expansível mostra "À Vista/Débito" e "Crédito" com sub-detalhamento
- [x] Dashboard: card Cartão de Crédito mostra total correto com assinaturas + parcelas + avulsas
- [x] Dashboard: Receitas com lista de fontes (salário, freelancer, etc)

## Correção v1.8 - Dashboard Layout
- [x] Dashboard: linha superior com 3 cards (Receitas, Despesas, Saldo)
- [x] Dashboard: sub-linha abaixo de Despesas com 2 cards (À Vista/Débito e Cartão de Crédito)
- [x] Dashboard: remover card de Cartão de Crédito da linha superior

## Melhoria v1.9 - Gráfico de Rosca no Dashboard
- [x] Backend: endpoint categoryBreakdown retornando total por categoria de despesa do mês
- [x] Dashboard: substituir 2 sub-cards por gráfico de rosca (donut) com legenda por categoria
- [x] Dashboard: legenda com nome, valor e percentual de cada categoria

## Bugfix v1.9.1 - Categorias no Gráfico de Rosca
- [x] Corrigido: categorias padrão (IDs negativos) não eram reconhecidas pelo backend
- [x] Backend getCategoryBreakdown agora inclui mapeamento das 13 categorias padrão

## Bugfix v1.9.2 - Categoria "Outros" e Relatórios
- [x] Identificar e corrigir origem da categoria "Outros": renomeado para "Sem Categoria" (lançamentos sem categoryId: Vivara, Franquia Carro, Ifood, Viagem)
- [x] Relatórios: corrigir saldo acumulado incorreto - agora considera apenas meses com dados reais
- [x] Relatórios: corrigir exibição de meses sem dados reais - meses vazios não inflam os totais com recorrentes

## Melhorias v2.0
- [x] Edição de parcelamentos: botão lápis + modal com descrição, categoria e observações
- [x] Edição de transações de cartão: botão lápis em Parcelas, Esporadicas e Débito + modal
- [x] Edição já existia em: despesas, receitas, recorrentes
- [x] Categoria obrigatória no formulário de despesas avulsas
- [x] Categoria obrigatória no formulário de parcelamentos
- [x] Categoria obrigatória no formulário de transações de cartão de crédito (criar e editar)
- [x] Categoria obrigatória no formulário de recorrentes (tipo despesa)
- [x] Tooltip no gráfico de rosca do Dashboard: nome, valor e % do total ao passar o mouse

# InkManager — O que o app é e o que ele resolve

> Documento de contexto para discutir o futuro do produto. Foco: o app em si —
> problema, para quem, o que já faz, decisões de produto já tomadas, estado atual
> e perguntas em aberto. (Estratégia de Claude/ecossistema maior fica em `docs/ROADMAP.md`.)

## Em uma frase
Um sistema de gestão mobile-first para o **tatuador autônomo/freelancer** — controla
clientes, projetos, sessões, estúdios parceiros, comissões e finanças, tudo num app
que parece nativo no celular.

## O problema que resolve
Tatuadores autônomos normalmente gerenciam o negócio de forma informal: agenda no
WhatsApp, valores anotados em papel ou de cabeça, sem visão clara de quanto
faturam, quanto pagam de comissão pros estúdios onde trabalham, nem quanto sobra
de lucro de fato. Isso gera:
- Perda de controle financeiro (não sabe se está lucrando ou só girando dinheiro)
- Esquecimento de acertos de comissão com estúdios
- Falta de histórico organizado por cliente/projeto (útil pra fechar orçamentos,
  lembrar de alergias/condições de saúde, follow-up)
- Dificuldade de separar "recebi da tattoo" de "isso ainda vai virar lucro depois
  de tirar material, comissão e despesas"

O InkManager centraliza tudo isso num único lugar, pensado pro fluxo real de quem
tatua em mais de um estúdio, cobra de formas diferentes por projeto, e quer ver a
saúde financeira do negócio num relance.

## Para quem é
- Tatuador(a) autônomo(a), possivelmente atendendo em **múltiplos estúdios**
- Cobra tanto **por sessão avulsa** quanto **projetos fechados** (valor total combinado)
- Precisa prestar contas de **comissão** pros estúdios onde trabalha
- Quer entender, no fim do mês, quanto entrou, quanto saiu e quanto sobrou

## O que o app faz hoje (por módulo)

### Clientes
Cadastro com nome, WhatsApp (contato direto por link), CPF, nascimento (aniversários
aparecem no Dashboard), cidade/estado com autocomplete local, e um campo de **alerta
de saúde** que aparece em destaque sempre que aquele cliente está envolvido numa
sessão ou projeto (ex: alergias, condições que afetam a sessão).

### Projetos
Cada projeto pertence a um cliente e tem **dois modelos de cobrança**, escolhidos na
criação:
- **Por sessão**: cada sessão é uma transação financeira independente
- **Fechado**: valor total combinado antecipadamente para o projeto inteiro,
  o pagamento do cliente é controlado na tela do projeto (não sessão a sessão)

Projeto guarda: nome, áreas do corpo (seleção múltipla por região — cabeça, tronco,
braços, pernas), sessões estimadas, status (ativo/pausado/concluído — só pode
concluir com pelo menos 1 sessão registrada).

### Sessões
Cada encontro com o cliente. Guarda data, status (agendada/concluída), estúdio onde
aconteceu, custo de material (dropdown com tamanhos configuráveis + opção de valor
específico), agulhas usadas (seleção múltipla), foto de anamnese, observações.

O financeiro de cada sessão se adapta ao tipo de projeto:
- **Por sessão**: registra o pagamento do cliente ali mesmo (até 2 formas de
  pagamento — ex: metade PIX, metade crédito)
- **Fechado**: não registra pagamento (isso é feito no projeto); guarda apenas
  "valor desta sessão", usado só para calcular a comissão proporcional do estúdio

Todos os campos podem ser preenchidos **antes ou depois** da sessão acontecer —
tanto pré-cadastrar uma sessão futura quanto lançar retroativamente uma que já
aconteceu.

### Estúdios e comissões
Cada estúdio parceiro tem uma regra de comissão (percentual ou valor fixo). Ao
escolher o estúdio numa sessão, a comissão é calculada automaticamente — mas o
valor fica **congelado (snapshot)** na sessão: se a taxa do estúdio mudar depois,
sessões já lançadas mantêm a comissão da época, protegendo o histórico.

### Acerto de contas (payout)
Sessões concluídas com comissão pendente entram numa fila de "a repassar" por
estúdio. O tatuador pode "dar baixa" (marcar como pago) em lote, criando um
registro de repasse — só sessões efetivamente concluídas com comissão > 0 entram
nessa fila.

### Despesas
Registro de custos do negócio (categoria, valor, vencimento, data de pagamento),
separado da operação de sessões/projetos.

### Configurações
Custos padrão de material por tamanho, presets de agulha reutilizáveis nas sessões.

### Dashboard financeiro
Visão geral: saudação personalizada com dados do login, resultado do mês (lucro
líquido em destaque), faturamento, total a pagar (despesas em aberto + comissões
pendentes), agenda de próximas sessões, comissões pendentes por estúdio,
aniversariantes do mês, e um gráfico de lucro mensal dos últimos 6 meses.

### Autenticação e dados por usuário
Login via Google (OAuth). Cada usuário só acessa os próprios dados (isolamento por
`user_id` + regras de segurança no banco) — o app suporta múltiplos tatuadores
usando de forma independente, sem ver dados uns dos outros.

## Decisões de produto já tomadas (para não reabrir debates)
- Sessão só entra no fluxo de acerto de comissão quando está **Concluída**
- Concluir uma sessão **não sobrescreve** os dados financeiros já preenchidos
- Projeto só pode ser concluído com ao menos uma sessão
- Pagamento de projeto fechado vive no **projeto**, não na sessão
- Comissão é um valor **histórico congelado**, não recalculado retroativamente
- Sessões podem ter até **2 formas de pagamento** simultâneas
- Interface pensada **mobile primeiro** (iPhone/iPad/Android), touch, não mouse

## Estado atual
- Em produção, uso real em teste com o autor e amigos convidados
- Visual: tema escuro, linguagem de "vidro líquido" (blur) na navegação/cabeçalhos,
  brilho de marca ambiente, tipografia numérica expressiva nos KPIs
- Stack: React 18 + Vite + Tailwind, Supabase (Postgres + Auth + Storage), deploy
  na Vercel como PWA (ainda não instalável "de verdade" — falta manifest, ícones,
  splash screen, funcionamento offline)
- Multi-usuário funcionando (cada tatuador vê só seus próprios dados)

## Perguntas em aberto para o futuro
- **Nome do app**: em processo de rebranding (saindo de "InkManager")
- **Distribuição**: continuar como PWA instalável, ou embrulhar com Capacitor pra
  publicar nas lojas (App Store/Play) quando precisar de câmera/push/agenda nativos?
- **Produto pra outros tatuadores**: hoje serve o autor + amigos testando. Isso vira
  um produto que outros tatuadores autônomos pagariam para usar? Que mudaria
  (onboarding, planos, suporte, multi-estúdio compartilhado entre tatuadores no
  mesmo espaço)?
- **Integração com agenda** (Google Calendar) para sessões agendadas
- **Relatórios/exportação** (ex: para contador, imposto de renda)
- **Anexos além da anamnese** (ex: referências de tatuagem, fotos do resultado final)

# Roadmap & Estratégia Claude — Ecossistema do Fernando

> Documento de planejamento durável. A memória de conversa é volátil; **isto** é a
> fonte de verdade. Retomar por aqui em qualquer sessão futura.

## Status atual do InkManager (jul/2026) — LER PRIMEIRO
- **Feito (estético):** liquid glass no chrome (nav, header sticky, modais) em todas as
  telas; `AmbientGlow` (luz de tinta) atrás do header em todas; Dashboard redesenhado
  (bento: hero "Resultado" com gradiente de marca + tiles Faturamento/A pagar + tipografia
  expressiva); gráfico próprio `CashflowChart` (barra/mês = receita, base custo + topo lucro
  em gradiente) no lugar do Recharts.
- **Feito (base):** PWA no Vercel (argon-react-native-five.vercel.app), login Google OAuth,
  Supabase. Migrations 002/003/004 aplicadas.
- **PRIORITÁRIO — rodar `supabase/migrations/005_multi_tenant.sql`:** hoje todos os usuários
  compartilham os mesmos dados (RLS desligada → anon key vê tudo). A migration adiciona
  `user_id` + RLS por dono em todas as tabelas, para cada usuário ter os próprios dados.
  Depois de rodar, testar com 2 contas.
- **Em andamento (visual):** polidos `Card` (rounded-2xl + feedback de toque), `Chip`/`Button`
  (glow de marca no estado ativo/primário), `Input`/`Select`/`Textarea` (cores por token +
  anel de foco + slots de ícone), `EmptyState` (ícone com gradiente da hero card) e `Badge`.
  Busca e chips de filtro em ClientList/ProjectList/SessionList/Expenses migrados para os
  componentes compartilhados (antes eram `<input>`/`<button>` soltos duplicando estilo);
  StudioList ganhou o header sticky com glass que as outras telas já tinham (estava faltando).
  **Falta:** telas de formulário/detalhe (ProjectForm, ProjectDetail, SessionDetail,
  StudioForm, ClientForm, ClientDetail, Settings, StudioPayout) ainda têm trechos com cores
  cruas (`bg-[#2A2A2A]`) em widgets customizados (toggles de segmento, seletor de área do
  corpo) — não são um simples Input/Select, precisam de olhar caso a caso.
- **Depois (não agora):** tornar o app PWA instalável de verdade (manifest, ícones, splash,
  service worker/offline, self-host da fonte Inter). Só após refinar o visual.

## Quem é o usuário
- **12 anos como programador** — code-native, ambiente de código é íntimo.
- Tatuador + empreendedor. Quer escalar muito, com muitas necessidades.
- Fluxo atual: descreve features, Claude implementa, commit → push → Vercel → testa na URL.

## Os 3 pilares
1. **Carreira Tattoo** — Instagram, anúncios, ideias, melhorias, conteúdo, tendências,
   precificação, ritmo de trabalho. Futuro: rotinas automáticas (ex: IA/integração
   manda mensagem para clientes ao sinalizar), site próprio.
2. **InkManager** — o app que estamos construindo (este repositório). Se escalar:
   ciclo de vida completo (marketing, contábil, sistêmico, site, dashboard, Instagram,
   tráfego, ideias, melhorias).
3. **Buzman Galeria** (loja) — prints, artes plásticas, mandalas, decorações, camisetas.
   Ainda não começou (falta organização digital). Vai exigir TODO o ciclo: venda,
   contábil, site, loja, Instagram, organização, ideias.

## Sequência acordada (ordem de ataque)
1. **Agora**: terminar poucos ajustes no InkManager (finalizar hoje — está bem legal).
2. **Depois**: organizar o **Pilar 1** (carreira/Instagram). Começar por **rotinas
   simples**; depois, com ajuda do Claude, **otimizar** essas rotinas.
3. **Por fim**: atacar o **Pilar 3** (loja Buzman Galeria) — ciclo completo.

> Regra: **não ligar os 3 de uma vez.** Priorizar e sequenciar.

## Estratégia de configuração do Claude (decidida)

### Ferramenta certa por tipo de trabalho
| Trabalho | Ferramenta |
|---|---|
| Criativo/estratégico/exploratório (ideias, tendências, tom de voz, preço) | **claude.ai Projects** (marca-cérebro por domínio) |
| Software e automação técnica | **Claude Code** (agentes, skills, hooks) |
| Conectar a sistemas reais (Instagram/Meta, contábil, agenda, Canva, Supabase) | **MCP servers** (ele mesmo pode escrever, é dev) |
| IA dentro dos produtos (assistente p/ clientes) | **código + API** |

### Ambiente
- **Cockpit principal = VS Code / Claude Code local** (ele é dev): loop interativo p/
  agentes/skills, **MCP servers locais próprios**, hooks, slash commands, diffs inline.
- **Web** continua útil p/ tarefas assíncronas e mobile. Mesmo repositório, duas portas.
- **Projects (claude.ai)** para o trabalho criativo/estratégico do Pilar 1.

### Estrutura de repositórios (polyrepo)
- Um repo por domínio: `inkmanager`, `buzman-galeria`, `tattoo-ops` (marketing/conteúdo).
- Cada repo com `.claude/`: `CLAUDE.md` (fonte de verdade), `agents/`, `skills/`,
  `settings.json` (permissões + hooks), config de MCP.
- Um **repo "meta"** pessoal p/ skills/prompts/MCP **compartilhados** entre os 3
  (empacotáveis como plugin, instaláveis em cada domínio) — evita duplicar.

### Princípios
- Codificar em **skill/agente** só o que é **repetível e estável**. Exploração fica em
  conversa/Project.
- **Skill** = receita repetível. **Agente** = tarefa multi-passo bounded. **MCP** =
  ponte pro mundo real (o maior multiplicador).
- **Fundação de contexto persistente** primeiro, senão perde tudo em resumo.

## Atualizações
- **Stack de ambiente decidida**: **VS Code + Obsidian + Git**. Usuário vai **formatar o
  PC** antes, pra estruturar tudo. Configuração do ambiente marcada para a **tarde**
  (após retomar/fechar ajustes do InkManager de manhã).
- **Obsidian**: vault markdown local = "segunda mente". Versionável em Git e **lido/escrito
  nativamente pelo Claude Code**. Para um dev, tende a ser **melhor que claude.ai Projects**
  como base de conhecimento (contexto de marca, tendências, rotinas) — tudo local e em Git.
  Considerar o vault do Obsidian como o repositório de contexto dos pilares.
- **Pilar 1 (carreira tattoo)**: usuário tem **documentos de contexto bem detalhados** para
  fornecer. Incorporar ao vault/repo quando começarmos o Pilar 1.

## Mobile / plataforma (requisito firme)
- O InkManager **deve ser um app mobile** com cara de nativo em **iPad, iPhone e Android**.
  Web é uso secundário, não o alvo principal.
- **UI touch-first**: `hover` vira feedback de toque (`:active`/press), **safe areas**
  (`env(safe-area-inset-*)`), alvos ≥ 44px, zona do polegar, respeitar "reduzir movimento".
- **Identidade única e coesa** entre as 3 plataformas — NÃO imitar o visual nativo de cada
  OS. Marca consistente > parecer iOS num e Android no outro.
- **Estado atual**: é um **PWA** (Vite + React) — já instalável na tela inicial dos 3.
- **Decisão de distribuição (recomendação registrada)**: **PWA agora → Capacitor quando
  precisar de loja / APIs nativas** (câmera, push, agenda). Capacitor reaproveita 100% do
  código atual (um só codebase). **Evitar rewrite nativo (React Native)** — fragmenta o
  código e reduz a alavancagem de iterar com IA. RN só se um requisito específico forçar.
- Detalhe: App Store exige conta Apple Developer (US$99/ano) + revisão; Play, conta Google
  (US$25 única). PWA não exige nenhum dos dois.

## Próximo passo estratégico (quando o usuário pedir)
Montar a **fundação `.claude/` do InkManager** (CLAUDE.md + primeiras skills + settings
com hooks) como **template** a ser replicado nos 3 pilares. Não iniciar até ele sinalizar
— prioridade agora é fechar os ajustes do InkManager.

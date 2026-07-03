# Roadmap & Estratégia Claude — Ecossistema do Fernando

> Documento de planejamento durável. A memória de conversa é volátil; **isto** é a
> fonte de verdade. Retomar por aqui em qualquer sessão futura.

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

## Próximo passo estratégico (quando o usuário pedir)
Montar a **fundação `.claude/` do InkManager** (CLAUDE.md + primeiras skills + settings
com hooks) como **template** a ser replicado nos 3 pilares. Não iniciar até ele sinalizar
— prioridade agora é fechar os ajustes do InkManager.

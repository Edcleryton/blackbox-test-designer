# Design de Páginas — Gerador de Casos de Teste (Caixa Preta)

## Diretrizes globais (desktop-first)
- **Layout:** Grid (12 colunas) para estrutura geral + Flexbox para alinhamentos internos. Container central com largura máx. ~1200px.
- **Espaçamento:** escala 4/8/12/16/24/32px; seções empilhadas com 24–32px.
- **Tipografia:** base 16px; títulos 24/20/18; texto 14–16.
- **Cores (tokens):**
  - Background: #0B1020 (dark) ou #FFFFFF (light) — escolher 1 tema inicial.
  - Surface: cards com contraste (ex.: #111833 no dark).
  - Texto primário: alto contraste; texto secundário: 70%.
  - Acento: azul/teal para ações primárias.
- **Botões:**
  - Primário: “Continuar / Gerar / Exportar”; hover com leve aumento de brilho; disabled com opacidade.
  - Secundário: “Voltar / Reiniciar”.
- **Estados:** loading (spinner + texto), empty state (instrução do que falta preencher), erro de validação (mensagem inline por campo).
- **Responsivo:**
  - >=1024px: duas colunas no Passo 3 (lista de técnicas à esquerda + painel de configuração à direita) e tabela ampla no Passo 4.
  - 768–1023px: colunas empilham; tabela com scroll horizontal.

---

## Página: Gerador (Assistente em 4 passos)

### Meta Information
- **Title:** Gerador de Casos de Teste — Caixa Preta
- **Description:** Gere, combine sem duplicar e exporte casos de teste usando técnicas de caixa preta.
- **Open Graph:** og:title, og:description, og:type=website.

### Page Structure
Padrão de página única com seções empilhadas:
1) Header fixo/estático
2) Card principal do assistente (Stepper + conteúdo do passo)
3) Área de resultados (Passo 4) com tabela e ações

### Seções & Componentes

#### 1) Header
- **Logo/Nome do app** (esquerda)
- **Ações** (direita): “Reiniciar”, “Salvar rascunho” (se houver Local Storage), link curto “Como funciona” (abre modal leve com explicação das técnicas)

#### 2) Stepper (sempre visível no card do assistente)
- 4 etapas com labels:
  1. Contexto
  2. Técnicas
  3. Configuração
  4. Revisão & Exportação
- Estado: concluído/atual/bloqueado.
- Navegação: “Voltar” e “Continuar” no rodapé do card.

#### 3) Passo 1 — Contexto do teste
- **Campos (mínimo):**
  - Nome da funcionalidade (input)
  - Descrição/Objetivo (textarea)
  - Entradas relevantes (textarea curta, opcional)
  - Saídas/Comportamento esperado (textarea curta, opcional)
  - Restrições/Premissas (textarea, opcional)
- **Validação:** exigir Nome + Descrição para avançar.

#### 4) Passo 2 — Seleção de técnicas
- Lista de técnicas em **cards com checkbox** e descrição curta.
- Cada card tem “ver detalhes” (popover/modal) com o que a técnica precisa como entrada.
- Validação: exigir pelo menos 1 técnica selecionada.

#### 5) Passo 3 — Configuração por técnica
- Layout desktop em 2 colunas:
  - **Coluna esquerda:** lista de técnicas selecionadas (tabs verticais).
  - **Coluna direita:** formulário da técnica ativa.
- Exemplos de parâmetros (renderizados conforme técnica):
  - Particionamento em classes: classes válidas/inválidas (lista editável)
  - Análise de valor limite: mínimo/máximo e valores próximos
  - Tabela de decisão: condições, regras, ações
  - Transição de estados: estados, eventos, transições
- CTA: “Gerar casos” (leva ao Passo 4).

#### 6) Passo 4 — Revisão, deduplicação e exportação
- **Barra de resumo:** total gerado, total após deduplicação, técnicas usadas.
- **Filtros básicos:** por técnica/origem e busca por texto.
- **Tabela de casos de teste:**
  - Colunas: ID, Título, Técnica, Pré-condições, Passos, Resultado esperado, Ações
  - Ações por linha: editar (inline ou drawer), remover
- **Deduplicação (UI):**
  - Toggle “Deduplicar automaticamente” (padrão ligado)
  - Opcional: seção “Possíveis duplicados” (lista compacta) para revisão
- **Exportação:**
  - Seletor de formato: CSV | JSON
  - Botão primário: “Exportar” (download)

### Interações e transições
- Transição suave ao trocar etapas (fade/slide leve).
- Persistir rascunho automaticamente ao avançar de etapa (se habilitado), sem exigir login.

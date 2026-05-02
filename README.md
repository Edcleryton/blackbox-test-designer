# Blackbox Test Designer

![React](https://img.shields.io/badge/react-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/typescript-5-blue?logo=typescript)
![Vite](https://img.shields.io/badge/vite-6-purple?logo=vite)
![Vitest](https://img.shields.io/badge/tested%20with-vitest-6E9F18?logo=vitest)

Ferramenta web para apoio ao design de casos de teste usando **técnicas de teste caixa-preta**. Através de um wizard interativo, o usuário seleciona a técnica, configura os parâmetros e exporta os casos gerados em múltiplos formatos.

## Funcionalidades

- Wizard guiado em etapas (seleção de técnica → configuração → geração → exportação)
- Técnicas suportadas: Partição por equivalência, Análise de valor limite, Tabela de decisão e outras
- Exportação dos casos de teste em **CSV**, **TXT**, **XLSX** e **JSON**
- Interface responsiva com Tailwind CSS

## Pré-requisitos

- Node.js 18+
- npm

## Instalação e uso

```bash
git clone https://github.com/Edcleryton/blackbox-test-designer.git
cd blackbox-test-designer
npm install

# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Pré-visualizar build
npm run preview
```

## Testes

```bash
# Executar testes unitários
npm test

# Verificação de tipos TypeScript
npm run check
```

**Resultado: 5/5 testes passando** (engine de geração + exporters).

## Estrutura do projeto

```
blackbox-test-designer/
├── src/
│   ├── core/
│   │   └── catalog.ts         # Catálogo de técnicas e tipos
│   ├── components/
│   │   ├── ui/                # Componentes base (Button, Card, Input...)
│   │   └── wizard/            # Etapas do wizard (TechniquePicker, CaseTable...)
│   ├── pages/
│   │   └── Home.tsx           # Página principal com o wizard completo
│   ├── utils/
│   │   └── export/            # Exportadores (CSV, TXT, XLSX, JSON)
│   └── stores/                # Estado global (Zustand)
├── public/
└── vite.config.ts
```

## Licença

MIT

## Autor

[Edcleryton Silva](https://github.com/Edcleryton)

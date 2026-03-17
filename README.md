# GlucoCare

Aplicativo para registro e acompanhamento de medições de glicose. Permite cadastrar valores (mg/dL), data e hora, ver resumos e gráficos, e manter um histórico com filtros e busca. Funciona só no navegador (dados no localStorage) ou conectado a um backend opcional (SQLite).

## O que o app faz

- **Dashboard**: cards com última medição, média dos últimos 7 dias, medições de hoje e quantas ficaram no alvo (70–140 mg/dL) na última semana.
- **Resumo**: meta 70–140, percentual no alvo, tendência (subindo/descendo/estável), mínimo e máximo dos últimos 7 dias.
- **Nova medição**: formulário (glicose, data, hora, observação opcional). Validação 20–600 mg/dL.
- **Edição**: na tabela de histórico, botão Editar preenche o formulário; ao salvar envia atualização (PATCH) ao backend ou atualiza dados locais.
- **Gráfico**: evolução da glicose no tempo com faixa alvo (70–140) destacada. Recharts, responsivo.
- **Histórico**: tabela com data, hora, valor, status (BAIXA/NORMAL/ALTA), observação. Filtros 7 dias / 30 dias / todas. Busca por valor ou observação. Ações: Editar e Excluir (com confirmação).
- **Exportar CSV**: download do histórico em CSV (UTF-8 com BOM).
- **Backup e restauro**: exportar todas as medições em JSON; restaurar a partir de um arquivo JSON (substitui os dados atuais, com confirmação). Com backend, o restauro apaga as medições no servidor e recria com as do arquivo.
- **Tema**: alternância claro/escuro (persistida no localStorage).
- **Offline**: sem backend, os dados ficam no localStorage; o header indica "Dados locais" ou "Conectado ao servidor".

## Tecnologias

- **Frontend**: React 19, TypeScript, Vite. Recharts para gráficos, Day.js para datas. CSS com variáveis e tema claro/escuro.
- **Backend (opcional)**: Node.js, Express, SQLite. API REST em `/api/*`. Ver [server/README.md](server/README.md) para endpoints e como rodar.

## Como rodar

### Só o frontend (dados no navegador)

```bash
npm install
npm run dev
```

Abre em **http://localhost:5173**. Nenhum backend necessário; as medições são salvas no localStorage.

### Frontend + backend (dados no servidor)

1. Na raiz do projeto:

```bash
npm install
npm run dev
```

2. Em outro terminal, subir a API:

```bash
npm run server
```

Ou, para recarregar o servidor ao editar arquivos:

```bash
npm run server:dev
```

O backend usa **http://localhost:3001**. O Vite faz proxy de `/api` para esse servidor, então o front continua acessando **http://localhost:5173**.

### Build para produção

```bash
npm run build
```

A saída fica em `dist/`. Para servir localmente: `npm run preview`.

## Estrutura do projeto

```
glucose-monitor/
  index.html          # Página única, título GlucoCare
  package.json        # Scripts e dependências do front
  vite.config.ts      # Proxy /api -> localhost:3001
  public/             # favicon, ícones
  src/
    App.tsx           # Layout, estado global, integração API/localStorage
    api.ts            # Cliente HTTP para /api/measurements e /api/measurements/stats
    types/measurement.ts
    components/       # DashboardCards, SummaryBlock, MeasureForm, MeasureList, GlucoseChart
    index.css         # Variáveis de tema, fonte
    App.css           # Estilos da aplicação
  server/             # Backend Express + SQLite
    README.md         # Documentação da API
    index.js          # Rotas e servidor
    db.js             # Acesso ao SQLite
```

O banco SQLite (`server/glucocare.db`) não vai para o repositório (está no `.gitignore`).

## Licença

Uso livre para fins pessoais e didáticos.

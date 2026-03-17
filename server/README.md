# GlucoCare API

Backend em Node.js (Express + SQLite) para o app GlucoCare.

## Como rodar

```bash
cd server
npm install
npm run dev
```

A API sobe em **http://localhost:3001**.

Com o frontend (`npm run dev` na raiz), as chamadas para `/api` são repassadas para o backend pelo proxy do Vite.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/measurements` | Lista todas as medições |
| GET | `/api/measurements/stats` | Estatísticas (última, média 7d, hoje, no alvo) |
| GET | `/api/measurements/:id` | Uma medição por ID |
| POST | `/api/measurements` | Cria medição (body: `{ glucose, date, time }`) |
| DELETE | `/api/measurements/:id` | Remove uma medição |

## Banco

SQLite, arquivo `glucocare.db` na pasta `server`. A tabela é criada ao subir o servidor.

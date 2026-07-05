# futevolei-facil

Futevôlei Fácil é uma plataforma web desenvolvida para simplificar a organização de
torneios de futevôlei. O sistema permite divulgar campeonatos, gerenciar inscrições
(individuais ou em dupla), processar pagamentos, e centralizar todas as informações
dos eventos em um único lugar — substituindo o controle manual feito hoje em grupos
de WhatsApp.

## Stack

- **Backend:** TypeScript + Express
- **ORM:** Prisma (v6.x — ver nota de versão abaixo)
- **Banco de dados:** PostgreSQL (via Docker)
- **Autenticação:** JWT (token único, sem refresh token no MVP) + bcrypt
- **E-mail transacional:** Resend
- **Frontend:** React + TypeScript + Tailwind CSS (ainda não iniciado)

## Convenções do projeto

- Código, comentários, nomes de variável/tabela/rota: **inglês**.
- Texto exibido ao usuário (labels de UI, mensagens de erro, e-mails): **português**.
- Scripts do `package.json` devem funcionar nativamente no Windows/PowerShell
  (uso de `cross-env` quando necessário).

### ⚠️ Prisma fixado na v6.x
O Prisma 7 moveu a configuração de conexão com o banco (`url`) para fora do
`schema.prisma`, quebrando o setup usado aqui. Sempre instale com versão explícita:
```powershell
npm install -D prisma@^6.16.0
npm install @prisma/client@^6.16.0
```

---

## Como rodar o backend (Windows / PowerShell)

```powershell
cd backend

# 1. Instalar dependências
npm install

# 2. Subir o banco (requer Docker Desktop instalado e rodando)
docker compose up -d

# 3. Copiar variáveis de ambiente
copy .env.example .env
# depois, preencher: JWT_SECRET, RESEND_API_KEY, EMAIL_FROM

# 4. Rodar as migrations
npx prisma migrate dev

# 5. Subir o servidor
npm run dev
```

Health check: http://localhost:3333/health

---

## Status do desenvolvimento

Progresso seguindo o roadmap incremental definido no início do projeto.

| # | Etapa | Status |
|---|---|---|
| 1 | Fundação do projeto (Express, Prisma, Docker, TypeScript) | ✅ Concluído |
| 2 | Autenticação completa (RF01–RF05) | ✅ Concluído |
| 3 | CRUD de torneios (RF06–RF09) | ✅ Concluído |
| 4 | Inscrições — caso simples (individual) | ✅ Concluído |
| 5 | Pagamento manual (RF16) | 🔜 Próximo |
| 6 | Integração Mercado Pago (RF15, RF18) | ⏳ Pendente |
| 7 | Duplas — DUO_FIXED (RF11) | ✅ Concluído (adiantado) |
| 8 | Duplas — DUO_RANDOM / cumbuca | ❌ Fora do escopo do MVP |
| 9 | Cancelamento e reembolso completo (RN05, RN07) | ⏳ Pendente |
| 10 | Painel administrativo (dashboard, export CSV) | ⏳ Pendente |
| 11 | Notificações por e-mail (RF23) | ⏳ Pendente (estrutura de envio já existe, via Resend) |
| 12 | Frontend (React + Tailwind) | ⏳ Pendente |
| 13 | Docker completo + deploy | ⏳ Pendente |

### Módulos implementados no backend

- **`modules/auth`** — registro, login (JWT), recuperação de senha por e-mail (Resend)
- **`modules/users`** — perfil próprio (`/me`), listagem admin, promoção a admin
- **`modules/tournaments`** — criação (sempre como rascunho), edição, publicação,
  cancelamento, listagem paginada com filtros, detalhe público (sem dados sensíveis
  dos inscritos)
- **`modules/registrations`** — inscrição individual (`INDIVIDUAL`), inscrição de
  dupla já formada (`DUO_FIXED`, com nome do parceiro em texto livre, sem exigir
  conta), cancelamento pelo jogador, remoção/edição pelo admin, histórico de
  inscrições do usuário

### Regras de negócio já validadas (testadas manualmente)

- RN01 — impede inscrição duplicada no mesmo torneio
- RN03 — reserva temporária de vaga (expiração sob demanda, sem cron ainda)
- RN08 — contagem de vagas disponíveis considera apenas inscrições confirmadas/pendentes
- RN09 — impede que o jogador seja seu próprio parceiro de dupla
- RNF01 — rotas administrativas exigem papel `ADMIN`, validado no backend
- RNF03 — criação de inscrição é atômica (lock via `SELECT ... FOR UPDATE` na
  transação), evitando overselling de vagas em concorrência

### Decisões importantes de modelagem

- **Pagamento de dupla (`DUO_FIXED`)**: vinculado ao `Team` (não à `Registration`
  individual). Um `Team` pode ter até 2 `Payment`s (`OWNER_SHARE` + `PARTNER_SHARE`)
  ou 1 (`FULL`), permitindo que o dono pague a dupla inteira ou só a própria parte.
- **Parceiro em `DUO_FIXED`**: identificado apenas por nome (texto livre), sem
  necessidade de conta/login — o dono da inscrição é o único responsável por ela.
- **Cumbuca (`DUO_RANDOM`)**: fora do escopo do MVP; hoje funciona apenas como
  inscrição individual, sem sorteio de duplas.
- **`maxSlots`**: representa a unidade de inscrição do formato do torneio
  (jogadores em `INDIVIDUAL`/`DUO_RANDOM`, duplas em `DUO_FIXED`).

---

## Licença

Este projeto está sob a licença MIT — veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

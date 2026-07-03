# Futevôlei Torneios

## Conventions
- Code, comments, variable/table/route names: **English**.
- User-facing text (UI labels, error messages shown to the user, emails): **Portuguese**.

## Getting started (Windows / PowerShell)

```powershell
# 1. Start the database
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy environment variables
copy .env.example .env

# 4. Run the first migration (creates tables from schema.prisma)
npx prisma migrate dev --name init

# 5. Start the dev server
npm run dev
```

Health check: http://localhost:3333/health

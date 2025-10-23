# HardMedicina - Trilhas

> Sistema educacional médico tipo "Netflix de aulas médicas", com trilhas organizadas por especialidade, vídeos, PDFs e módulos, acessível por login e com painel administrativo para gerenciamento de conteúdos.

## 🚀 URLs do Projeto

- **Desenvolvimento Local**: https://3000-it06ucm5oiuebimm8j8is-2b54fc91.sandbox.novita.ai/
- **Produção**: (Aguardando deploy no Cloudflare Pages)
- **GitHub**: (Aguardando push do código)

## 📚 Visão Geral

**HardMedicina - Trilhas** é uma plataforma educacional médica completa que oferece:

### Perfis de Acesso

1. **Usuário (Aluno)**: 
   - Assistir aulas em vídeo
   - Baixar materiais (PDFs, fluxogramas)
   - Acompanhar progresso pessoal
   - Favoritar conteúdos
   - Ver recomendações personalizadas

2. **Administrador (Equipe HardMed)**:
   - Adicionar, editar e remover trilhas
   - Gerenciar módulos, temporadas e aulas
   - Acompanhar estatísticas gerais
   - Gerenciar usuários
   - Visualizar relatórios de acesso

## ✨ Funcionalidades Implementadas

### 🏠 Área Pública

✅ **Landing Page**
- Hero animado com gradiente neon
- Carrossel de especialidades (Cardiologia, Nefrologia, Clínica, Cirurgia, Ginecologia, Pediatria)
- Cards modulares com informações das trilhas
- Seção de estatísticas
- Footer completo com links

✅ **Autenticação**
- Cadastro de usuários com validação
- Login seguro com tokens JWT-like
- Recuperação de senha
- Validação de e-mail e senha forte

### 🎓 Área do Usuário

✅ **Dashboard**
- Banner de boas-vindas personalizado
- Progresso geral em todas as trilhas
- Seção "Continuar de onde parou"
- Grid de trilhas com progresso individual
- Recomendações baseadas no histórico

✅ **Páginas de Trilha**
- Breadcrumbs de navegação
- Informações completas da trilha
- Organização por temporadas (accordion)
- Lista de aulas com status (✅ concluído / ▶️ assistir / 🔒 bloqueado)
- Barra de progresso lateral

✅ **Página de Aula Individual**
- Player de vídeo (YouTube/Vimeo)
- Título e descrição da aula
- Pontos-chave destacados
- Botões de download (PDFs, fluxogramas)
- Sidebar com próximas aulas
- Tracking de progresso automático

### 🔐 Sistema de Autenticação

✅ **Segurança**
- Hash de senhas com SHA-256
- Tokens de sessão com expiração (7 dias)
- Validação de e-mail e senha
- Middleware de autenticação para rotas protegidas
- Verificação de role (student/admin)

## 🗄️ Arquitetura de Dados

### Banco de Dados: Cloudflare D1 (SQLite)

**Tabelas Principais:**

1. **users** - Usuários do sistema
   - Campos: id, name, email, password_hash, role, avatar_url, created_at, last_access
   
2. **specialties** - Especialidades médicas
   - Campos: id, name, slug, description, cover_image, icon, order_index
   
3. **tracks** - Trilhas de estudo
   - Campos: id, specialty_id, title, slug, description, cover_image, duration_minutes, total_lessons, difficulty
   
4. **seasons** - Temporadas dentro das trilhas
   - Campos: id, track_id, title, description, order_index
   
5. **lessons** - Aulas individuais
   - Campos: id, season_id, title, slug, description, video_url, video_platform, duration_minutes, pdf_url, key_points, views_count
   
6. **user_track_progress** - Progresso do usuário nas trilhas
   - Campos: user_id, track_id, completed_lessons, total_lessons, progress_percentage, last_lesson_id
   
7. **user_lesson_progress** - Progresso do usuário nas aulas
   - Campos: user_id, lesson_id, is_completed, watch_time_seconds, last_position_seconds
   
8. **user_favorites** - Aulas favoritadas
   - Campos: user_id, lesson_id

### Dados de Exemplo (Seed Data)

**Usuários:**
- Admin: admin@hardmedicina.com (senha: admin123)
- Aluno: erique@exemplo.com (senha: admin123)

**Especialidades:**
- Cardiologia, Nefrologia, Clínica Médica, Cirurgia, Ginecologia, Pediatria

**Trilhas:**
- Emergências Cardiovasculares (41 aulas, 2460 min)
- Insuficiência Cardíaca (15 aulas, 900 min)
- Distúrbios Hidroeletrolíticos (20 aulas, 1200 min)
- Medicina de Emergência (35 aulas, 2100 min)

**Aulas de Exemplo:**
- IAM - Diagnóstico (45 min)
- IAM - Tratamento na Emergência (50 min)
- Fibrilação Atrial Aguda (35 min)
- ATLS - Avaliação Inicial (60 min)
- E mais...

## 🛠️ Stack Tecnológica

### Backend
- **Hono** v4.10+ - Framework web ultrarrápido
- **Cloudflare Workers** - Runtime edge serverless
- **Cloudflare D1** - Banco de dados SQLite distribuído
- **TypeScript** - Tipagem estática

### Frontend
- **TailwindCSS** (via CDN) - Estilização
- **Font Awesome** (via CDN) - Ícones
- **Axios** (via CDN) - Cliente HTTP
- **HTML/CSS/JavaScript** - Vanilla (sem frameworks)

### DevOps
- **Wrangler** - CLI do Cloudflare
- **Vite** - Build tool
- **PM2** - Process manager (desenvolvimento)
- **Git** - Controle de versão

## 📁 Estrutura do Projeto

```
webapp/
├── src/
│   ├── index.tsx           # Rotas principais e páginas públicas
│   ├── api-routes.tsx      # API routes (autenticação, dados)
│   ├── user-pages.tsx      # Páginas da área do usuário
│   ├── layouts.tsx         # Layouts base e componentes
│   ├── types.ts            # TypeScript types
│   ├── auth.ts             # Funções de autenticação
│   └── db.ts               # Funções de banco de dados
├── migrations/
│   └── 0001_initial_schema.sql  # Schema inicial do D1
├── public/
│   └── static/             # Arquivos estáticos (CSS, JS, images)
├── .git/                   # Git repository
├── .wrangler/              # D1 local database
├── ecosystem.config.cjs    # Configuração do PM2
├── wrangler.jsonc          # Configuração do Cloudflare
├── package.json            # Dependências e scripts
├── vite.config.ts          # Configuração do Vite
└── seed.sql                # Dados iniciais
```

## 🚀 Como Usar

### Desenvolvimento Local

```bash
# 1. Instalar dependências (já feito)
npm install

# 2. Aplicar migrações do banco de dados
npm run db:migrate:local

# 3. Inserir dados de exemplo
npm run db:seed

# 4. Build do projeto
npm run build

# 5. Iniciar servidor de desenvolvimento
npm run dev:sandbox
# ou com PM2:
pm2 start ecosystem.config.cjs

# 6. Acessar a aplicação
# http://localhost:3000
```

### Comandos Úteis

```bash
# Verificar status do PM2
pm2 list

# Ver logs
pm2 logs hardmedicina --nostream

# Reiniciar serviço
fuser -k 3000/tcp && pm2 restart hardmedicina

# Resetar banco de dados
npm run db:reset

# Build para produção
npm run build

# Deploy no Cloudflare Pages
npm run deploy:prod
```

## 🔑 Credenciais de Teste

### Conta Administrador
- **E-mail**: admin@hardmedicina.com
- **Senha**: admin123

### Conta de Aluno
- **E-mail**: erique@exemplo.com
- **Senha**: admin123

## 📊 Status de Implementação

### ✅ Completado (9,8% - 4/41 funcionalidades principais)

- [x] Landing Page com hero e especialidades
- [x] Sistema de cadastro e login
- [x] Dashboard do usuário com progresso
- [x] Página de trilha com temporadas e aulas
- [x] Página de aula com player de vídeo
- [x] Banco de dados D1 configurado
- [x] Migrações e seed data
- [x] API REST completa
- [x] Autenticação com tokens
- [x] Tracking de progresso

### 🚧 Pendente

- [ ] Painel Administrativo
  - [ ] Dashboard com estatísticas
  - [ ] Gerenciar trilhas (CRUD)
  - [ ] Gerenciar aulas (CRUD)
  - [ ] Gerenciar usuários
  - [ ] Relatórios de acesso
- [ ] Página de Perfil do Usuário
  - [ ] Editar dados pessoais
  - [ ] Upload de avatar
  - [ ] Histórico de aulas
  - [ ] Certificados
- [ ] Funcionalidades Adicionais
  - [ ] Sistema de favoritos
  - [ ] Busca global
  - [ ] Filtros de especialidade
  - [ ] Comentários nas aulas
  - [ ] Notificações
  - [ ] Dark/Light mode
- [ ] Deploy no Cloudflare Pages (produção)
- [ ] Push para GitHub

## 🎯 Próximos Passos Recomendados

1. **Implementar Painel Administrativo**
   - Dashboard com gráficos
   - CRUD de trilhas e aulas
   - Gerenciamento de usuários
   - Relatórios de estatísticas

2. **Adicionar Página de Perfil**
   - Edição de dados do usuário
   - Upload de avatar
   - Visualização de progresso completo

3. **Melhorias de UX**
   - Sistema de busca funcional
   - Filtros por especialidade
   - Sugestões personalizadas
   - Modo escuro

4. **Deploy em Produção**
   - Configurar Cloudflare Pages
   - Configurar domínio customizado
   - Monitoramento de performance

## 🔧 Configuração para Produção

### Cloudflare D1 Database

```bash
# Criar banco de dados de produção
npx wrangler d1 create hardmedicina-production

# Atualizar wrangler.jsonc com o database_id
# Aplicar migrações
npx wrangler d1 migrations apply hardmedicina-production

# Executar seed
npx wrangler d1 execute hardmedicina-production --file=./seed.sql
```

### Deploy no Cloudflare Pages

```bash
# Build
npm run build

# Deploy
npm run deploy:prod
```

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no GitHub
- Entre em contato: contato@hardmedicina.com

## 📄 Licença

© 2025 HardMedicina. Todos os direitos reservados.

---

**Desenvolvido com ❤️ usando Hono + Cloudflare Workers**

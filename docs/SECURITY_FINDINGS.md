# Segurança — correções e verificação

Atualização de 21/11/2026, após a revisão inicial. Verificação automatizada e funcional local; não é certificação nem auditoria externa. Nenhum teste ofensivo foi executado em produção.

## Correções implementadas

| Achado | Correção | Verificação |
| --- | --- | --- |
| Token sem assinatura permitia falsificar identidade/role | Tokens antigos deixaram de ser aceitos. Sessões opacas de 256 bits; apenas SHA-256 do token fica no D1 | Token sintético, cookie adulterado e credencial Bearer rejeitados |
| Role e usuário ativo não consultados em todas as APIs | Cada requisição resolve usuário ativo e role atual por sessão no D1 | Rebaixamento de admin e desativação invalidam o acesso imediatamente |
| Senhas em SHA-256 com salt fixo | scrypt nativo, N=16384, r=8, p=5, salt aleatório de 16 bytes | Salts diferentes, senha errada e formato malformado testados; migração automática no login correto |
| Tokens em JavaScript/localStorage e no JSON | Cookie HttpOnly, SameSite=Strict, Secure em HTTPS e sem Domain; JSON de login contém apenas usuário | Flags e ausência de token no JSON verificadas; login/logout exercitados no navegador |
| Sessões reutilizáveis após logout/troca de senha | Logout revoga no D1; troca de senha revoga todas as sessões anteriores e emite outra | Reutilização das sessões antigas rejeitada |
| Injeção SQL no filtro `GET /lessons?track_id=` | Parâmetro validado e vinculado com placeholder SQL | Payloads OR/UNION/múltiplos comandos recebem 400 |
| Tentativas de senha ilimitadas | Contadores atômicos no D1 por conta/IP; 10 logins por conta/15min, 50 por IP/15min e 5 cadastros/IP/hora | Excesso recebe 429 e Retry-After |
| Requisições mutáveis sem defesa contra CSRF | Origin/Sec-Fetch-Site, marcador próprio e JSON obrigatórios; CORS permissivo removido | Origem externa e ausência de marcador recebem 403 |
| Campos/URLs sem limite e HTML em renderizadores | JSON até 16KiB, limites/tipos/IDs; URLs executáveis rejeitadas; codificação de texto/atributos em usuários, trilhas, temporadas, aulas e notificações | Payload de tipo inválido, URL javascript e texto hostil testados |
| Credenciais de exemplo conhecidas | Login dessas credenciais bloqueado por padrão; exceção explícita somente em `.dev.vars` local | Login de demonstração sem a flag local recebe 403 |
| Dependências com 17 entradas altas | Atualizações compatíveis do lockfile; remoção do servidor Vite alternativo, substituído pelo Wrangler no fluxo de desenvolvimento | `npm audit`: 0 vulnerabilidades na última execução |

A implementação de scrypt segue uma das configurações de [referência da OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt). Foi usada a API nativa `node:crypto`, [suportada no runtime Cloudflare](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/), com `nodejs_compat` já presente no projeto.

## Migração e publicação

1. Confirmar acesso à conta/projeto Cloudflare e capacidade de recuperação administrativa.
2. Se uma conta de exemplo ainda estiver em uso, alterar sua senha antes da publicação. A nova versão não permitirá entrar com essas credenciais publicadas. Nunca colocar `ALLOW_DEMO_LOGIN=1` em produção ou previews.
3. Aplicar a migração **aditiva** `0003_secure_sessions.sql` no D1 de produção antes do novo Worker. Ela cria sessões/limites; não altera conteúdos nem senhas existentes.
4. Publicar o build correspondente. Todos precisarão entrar novamente; o formato de token anterior não é mais aceito. Senhas antigas são migradas individualmente após login válido, sem redefinição geral.
5. Conferir login, privilégios, logout e limites de CPU/latência no runtime e no plano de produção. Derivação de senha é intencionalmente custosa; pode exigir um orçamento de CPU superior ao plano gratuito. Nenhum plano ou limite pago foi alterado automaticamente.

Não executar `seed.sql` no D1 remoto. A migração foi aplicada somente ao banco local nesta rodada. A CLI Cloudflare estava sem autenticação; não houve deploy ou migração remota.

## Testes

`npm test`: 19 testes aprovados. A integração usa o router real e SQLite isolado em memória com adaptador D1; não acessa banco de produção nem altera o D1 local. O runtime Wrangler foi validado separadamente com login/scrypt nativo, APIs e navegador. `npm run build` e checagem sintática dos scripts frontend passaram. Relatório npm bruto local: `.wrangler/security-audit-current.json`.

No navegador local também foram exercitados login de aluno/admin, logout real, criação de notificação, feedback de sucesso e atualização parcial para inativa. O cookie não precisou ser lido pelo navegador para validar o fluxo.

## Limites e próximos controles

- A CSP ainda usa unsafe-inline e algumas páginas públicas dependem de CDNs. Migrar handlers/scripts inline e adotar nonce é uma etapa adicional.
- Ainda não há 2FA, recuperação real por e-mail, observabilidade/alertas de segurança ou auditoria externa completa.
- Usuários que não entrarem manterão o hash legado até migração no próximo login; considerar campanha de redefinição posterior.
- Os limites são janelas fixas e podem bloquear uma conta após tentativas hostis; proteção adaptativa/Turnstile pode reduzir abuso distribuído.
- O resultado zero do npm audit descreve apenas os advisories conhecidos na execução; não demonstra ausência de outras falhas.

O relatório antigo `SECURITY_AUDIT.md` continua apenas como histórico e não deve ser usado como aprovação de produção.

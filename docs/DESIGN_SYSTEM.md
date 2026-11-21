# Área logada — atualização de design

Implementada em 21/11/2026 na branch `codex/area-logada-design`, sobre o histórico do backup (`bca3cbf`).

## Direção visual

Referência: [Linea, da 8B](https://github.com/8bsite/app-landing-page-template). A adaptação usa Host Grotesk, papel `#faf5f0`, espresso `#1b1411`, papel secundário `#eee5dc`, azul-marinho `#1f3954` e verde `#33cc7a`. Texto verde usa um tom mais escuro no tema claro para preservar o contraste. O tema escuro usa superfícies espresso e texto claro.

Os tokens ficam em `public/static/app.css`; as cores semânticas das utilidades ficam em `tailwind.app.cjs`. As páginas autenticadas carregam CSS compilado localmente, sem Tailwind via CDN. A preferência de tema é independente das páginas públicas (`hardmed-app-theme`).

## Telas contempladas

- Dashboard, catálogo com busca e filtros, especialidade, trilha/temporadas, aula e perfil.
- Administração: visão geral, usuários, trilhas, temporadas, aulas, notificações e relatórios.
- Cabeçalho, navegação mobile, menus da conta e notificações, rodapé, formulários, tabelas e modais.

Login, cadastro, recuperação de senha e landing page mantêm seu conteúdo e estilos anteriores. O catálogo por especialidade agora exige sessão, como o catálogo principal.

## Comportamentos ajustados na integração

- “Minhas trilhas” usa os registros reais de progresso; o dashboard possui estado vazio e botão para tentar novamente em caso de erro.
- Cards compartilhados escapam texto, validam URLs de imagem e limitam percentuais entre 0 e 100.
- Busca local ignora acentos e combina com o filtro por especialidade.
- Removidos conquistas e recomendações fictícias do dashboard. As sugestões vêm do catálogo real.
- Removida uma segunda rota `/trilhas`, que nunca era executada. A página de especialidade passou a usar o cliente `api`, eliminando a chamada a `axios` ausente.
- Feedback de perfil/notificações reutiliza o diálogo compartilhado: o backup chamava `showToast` sem defini-lo.
- Notificações do cabeçalho têm escopo isolado para evitar conflito com a página administrativa.
- Modais recebem nome acessível, foco, ciclo de Tab e fechamento com Escape. Menus e temporadas expõem seus estados de expansão.
- Política `frame-src` permite apenas os provedores de vídeo previstos (YouTube, YouTube sem cookies e Vimeo). O texto de progresso da barra lateral usa o elemento correto.
- Relatórios usam os endpoints existentes e contagens reais. Métricas ainda não disponibilizadas são identificadas como indisponíveis; números aleatórios foram removidos. CSV exporta os dados disponíveis de aulas e trilhas.

## Desenvolvimento

```sh
npm install
# Copiar .dev.vars.example para .dev.vars somente no desenvolvimento local.
npm run db:migrate:local
npm run db:seed
npm run build
npm run dev:sandbox
```

`npm run build` compila `src/app-utilities.css` e depois o Worker. Ao mudar classes, refaça o build. O CSS gerado é versionado para que a prévia inicial também tenha estilos.

## Verificação executada

- Build Vite/Tailwind passou; todos os scripts frontend passaram em `node --check`.
- As 13 rotas autenticadas retornaram HTTP 200 com uma sessão administrativa local; CSS e JS estáticos retornaram os tipos de conteúdo corretos.
- Confirmado que as quatro páginas públicas principais não carregam os estilos novos.
- Banco D1 criado exclusivamente com `--local`, migrações e seed aplicados. Nenhum comando de banco remoto ou deploy foi executado.
- Navegador: login de aluno/admin e logout; dashboard com/sem progresso; busca sem acentos, filtro e nenhum resultado; expansão de temporadas; conclusão de aula e reversão; perfil; menus; páginas administrativas, formulários e tabelas.
- Conferência visual em 1440px e 375px, incluindo temas claro/escuro. Dashboard, perfil e tabelas administrativas não extrapolaram a largura da página no celular. Tabelas largas mantêm rolagem dentro do painel.
- Capturas de referência ficam em `../previews/` na pasta de trabalho, fora do código distribuído.

## Limites desta entrega

O backup não inclui as imagens e PDFs locais referenciados pelo seed. Cards preservam as capas configuradas; uma capa ausente mantém a superfície azul. Reprodução completa dos vídeos externos e downloads reais de material precisam ser validados com o conteúdo de produção. A exportação CSV foi implementada, mas o download não foi exercitado no navegador nesta rodada.

A tela de usuários já tinha botões de editar/desativar sem handlers; esta atualização visual não implementa esse CRUD. Relatórios não possuem dados por período nem tempo assistido agregado nos endpoints atuais. As correções de segurança posteriores, os 19 testes e as condições para publicar estão em `SECURITY_FINDINGS.md`. A publicação ainda depende de acesso Cloudflare, migração de sessões e validação no runtime de produção.

## Créditos

Design adaptado de Linea/8B (MIT; licença em `licenses/8b-linea.txt`). Fonte [Host Grotesk](https://fonts.google.com/specimen/Host+Grotesk), SIL Open Font License 1.1, carregada por Google Fonts. Não foram reutilizadas fotografias ou bibliotecas de animação do template. O crédito “Design: 8B” foi preservado no rodapé autenticado.

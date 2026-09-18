# Protocolo Coceira

Area de membros em Next.js + TypeScript, com biblioteca mobile em carrosseis, Supabase e liberacao automatica por compra aprovada na Cakto.

Nao ha contas ou conteudos de demonstracao.

## Rodar localmente

1. Instale com `npm.cmd install`.
2. Copie `.env.example` para `.env.local` e preencha as variaveis.
3. Execute `npm.cmd run dev` e abra http://localhost:3000.

Sem as variaveis, a tela de login funciona visualmente, mas nao autentica. Nunca coloque chaves secretas em variaveis `NEXT_PUBLIC_`.

## Supabase

1. Crie um projeto e execute `supabase/migrations/001_members.sql` uma vez no SQL Editor.
2. Configure a URL, a publishable key e a service role key nas variaveis locais e na Vercel.
3. Mantenha `SUPABASE_SERVICE_ROLE_KEY` apenas no servidor/Vercel como segredo.
4. O primeiro acesso nao envia e-mail: o comprador informa e-mail e cria uma senha. O servidor so cria/atualiza a senha se houver compra `paid` para esse e-mail e para um produto permitido.
5. O login normal usa e-mail e senha pelo Supabase Auth.

SMTP deixa de ser obrigatorio para o primeiro acesso. Se quiser recuperacao automatica de senha no futuro, configure SMTP em `Authentication > Emails > SMTP Settings` e implemente o fluxo de recuperacao.

## Cakto e Vercel

1. Publique o projeto na Vercel com as variaveis Supabase e `CAKTO_PRODUCT_IDS` (IDs completos dos produtos aceitos, separados por virgula).
2. Na integracao Webhook do produto na Cakto, cadastre `https://SEU-DOMINIO/api/webhooks/cakto`.
3. Selecione `purchase_approved`, `refund` e `chargeback`.
4. Copie a chave secreta desse webhook para `CAKTO_WEBHOOK_SECRET` na Vercel e faca novo deploy. Nao e o OAuth Client Secret nem a service role do Supabase.
5. O endpoint aceita assinatura por headers da Cakto ou o `secret` no payload, filtra produtos e grava os pedidos de forma idempotente.
6. Compartilhe com o comprador `https://SEU-DOMINIO/` como endereco de entrada. O webhook recebe eventos; nao e o link de login.

Esta integracao de recebimento nao precisa do Client ID/Client Secret da API Cakto nem do MCP. Revogue qualquer segredo exposto em conversas.

## Publicar materiais reais

No Table Editor, adicione linhas em `materials`:

- `product_id`: mesmo ID completo configurado na Cakto.
- `section`: `protocol`, `bonus` ou `checklist`.
- `label`: DIA 1, DIA 2, BONUS ESPECIAL etc.
- `title`, `description`, `body`: conteudo final; o texto preserva paragrafos, sem HTML executavel.
- `position`: ordem dos cards.
- `published`: true quando estiver pronto.
- `image_path` e `file_path`: caminhos dos arquivos enviados ao bucket privado `materials`, sem URL publica e sem o nome do bucket.

Cadastre Dia 1 a Dia 7, os bonus e o checklist com os textos e arquivos aprovados. O banco comeca vazio para nao apresentar demonstracoes como conteudo comprado.

## Verificacao antes de vender

- Rode `npm.cmd run build` e `npm.cmd test`.
- Envie uma compra aprovada real/teste para um produto permitido; verifique compra gravada e conteudo liberado ao e-mail correto.
- Teste primeiro acesso com o e-mail da compra e senha nova.
- Reenvie o mesmo evento; nao deve duplicar o pedido.
- Envie reembolso/chargeback; nova leitura dos materiais deve ser negada.
- Confirme que usuario sem compra, outro e-mail e sessao anonima nao leem materiais ou arquivos.

A Cakto nao reenvia automaticamente respostas HTTP 500; acompanhe o historico e reenvie as falhas. O teste fixo da Cakto pode trazer um ID de produto de exemplo e ser ignorado pelo filtro: ele valida conectividade, nao uma compra real.

Documentacao: https://docs.cakto.com.br/conceitos/webhooks

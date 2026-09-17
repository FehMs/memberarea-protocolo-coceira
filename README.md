# Protocolo Coceira

Next.js + TypeScript, biblioteca com carrosséis mobile, autenticação Supabase e acesso por compra Cakto. Não há contas ou conteúdos de demonstração.

## Rodar localmente

1. Instale com `npm.cmd install`.
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Execute `npm.cmd run dev` e abra http://localhost:3000.

Sem as variáveis, a tela de login funciona visualmente, mas não autentica. Nunca coloque chaves secretas em variáveis NEXT_PUBLIC.

## Supabase

1. Crie um projeto e execute `supabase/migrations/001_members.sql` uma vez no SQL Editor.
2. Configure a URL, a publishable key e a service_role key nas variáveis locais e na Vercel. A service_role é usada apenas pelo webhook.
3. Ative login por e-mail. Configure SMTP de produção e os limites de envio/captcha conforme seu tráfego.
4. No template de **Magic Link**, use o código `{{ .Token }}` no corpo do e-mail. O formulário usa OTP digitado, não link de redirecionamento. Faça o mesmo no template de confirmação de cadastro, se utilizado pelo projeto. Defina o tamanho do OTP entre 6 e 8 dígitos.
5. O primeiro acesso e a recuperação enviam OTP, confirmam o e-mail e permitem definir senha. Contas podem ser criadas, mas só compras pagas dão acesso aos materiais via RLS.

## Cakto e Vercel

1. Publique o projeto na Vercel com as variáveis Supabase e `CAKTO_PRODUCT_IDS` (IDs completos dos produtos aceitos, separados por vírgula).
2. Na integração Webhook do produto na Cakto, cadastre `https://SEU-DOMINIO/api/webhooks/cakto`.
3. Selecione `purchase_approved`, `refund` e `chargeback`. O escopo atual é produto de pagamento único, não assinatura.
4. Copie o segredo GERADO PARA ESSE WEBHOOK para `CAKTO_WEBHOOK_SECRET` na Vercel e faça novo deploy. Não é o OAuth Client Secret nem o header do MCP.
5. O endpoint exige X-Cakto-Timestamp e X-Cakto-Signature válidos, aceita V1 e V2, filtra produtos e grava em uma transação. As operações são idempotentes por pedido e um evento aprovado atrasado não reativa um pedido reembolsado. Uma recompra com novo ID pode liberar novamente.
6. Compartilhe com o comprador `https://SEU-DOMINIO/` como endereço de entrada. O webhook recebe eventos; não é o link de login.

Esta integração de recebimento não precisa do Client ID/Client Secret da API Cakto nem do MCP. Revogue qualquer segredo exposto em conversas. Nenhum segredo fornecido na conversa foi salvo neste projeto.

Não há envio automático de boas-vindas no webhook; configure a comunicação de acesso no seu fluxo de entrega. O Supabase envia o código quando o comprador solicita acesso na tela. Compras anteriores à configuração precisam ter os eventos reais reenviados pelo histórico da Cakto.

## Publicar materiais reais

No Table Editor, adicione linhas em `materials`:

- `product_id`: mesmo ID completo configurado na Cakto.
- `section`: `protocol`, `bonus` ou `checklist`.
- `label`: DIA 1, DIA 2, BÔNUS ESPECIAL etc.
- `title`, `description`, `body`: conteúdo final; o texto preserva parágrafos, sem HTML executável.
- `position`: ordem dos cards. `published`: true quando estiver pronto.
- `image_path` e `file_path`: caminhos dos arquivos enviados ao bucket privado `materials`, sem URL pública e sem o nome do bucket (ex.: `dia-1/capa.webp`, `dia-1/material.pdf`).

Cadastre Dia 1 a Dia 7, os três bônus e o checklist com os textos e arquivos aprovados. O banco começa vazio para não apresentar demonstrações como conteúdo comprado. Não há editor administrativo próprio; a publicação é pelo painel Supabase.

Imagens recebem URLs de cinco minutos e downloads de um minuto, emitidas somente após autorização RLS. Uma URL já emitida permanece válida até expirar. Conteúdo já lido não pode ser apagado da memória do comprador em um reembolso; novas leituras são bloqueadas.

## Verificação antes de vender

- `npm.cmd run build` e `npm.cmd test`.
- Confirmar e-mail e senha usando SMTP real.
- Enviar uma entrega assinada real para um produto permitido; verificar compra gravada e conteúdo liberado ao e-mail correto.
- Reenviar o mesmo evento; não deve duplicar o pedido.
- Enviar reembolso/chargeback; nova leitura dos materiais deve ser negada. Reenviar a aprovação antiga não deve reativar.
- Confirmar que usuário sem compra, outro e-mail e sessão anônima não leem materiais ou arquivos.

A Cakto não reenvia automaticamente respostas HTTP 500; acompanhe o histórico e reenvie as falhas. O handler não responde sucesso quando a gravação falha. O teste fixo da Cakto pode trazer um ID de produto de exemplo e será ignorado pelo filtro: ele valida conectividade, não uma compra real.

Documentação: https://docs.cakto.com.br/conceitos/webhooks e https://supabase.com/docs/reference/javascript/auth-signinwithotp.

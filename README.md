# GeoBlog — guia de implantação

**Arquitetura:** site estático (HTML/CSS/JS puro) no **GitHub Pages** + **Google Apps Script** como API + **Google Planilhas** como único banco.
Comunicação: `fetch` POST com `Content-Type: text/plain` (evita preflight CORS, que o Apps Script não suporta); o redirecionamento do `/exec` é seguido automaticamente; respostas em JSON `{ok, data | code, message}`.

## Backend (Apps Script)
1. Acesse script.google.com → **Novo projeto** → nomeie "GeoBlog API".
2. No arquivo `Code.gs` do projeto, apague tudo e cole o conteúdo inteiro de `backend/Code.gs` (arquivo único, tudo junto).
3. Selecione a função **setupGeoBlog** e clique em **Executar**. Autorize as permissões (Planilhas e Propriedades). Ela cria a planilha "GeoBlog - Banco de Dados" (abas Posts e Questions), configura o fuso America/Sao_Paulo e a senha inicial com hash+salt. Pode ser reexecutada sem apagar dados. O link da planilha aparece em **Execuções/Registro**.
4. **Implantar → Nova implantação → App da Web**: *Executar como:* **Eu**; *Quem pode acessar:* **Qualquer pessoa**. Copie a URL terminada em `/exec`.
5. Ao alterar o código depois: **Implantar → Gerenciar implantações → Editar → Nova versão** (a URL se mantém).

## Site
6. Em `site/js/config.js`, cole a URL `/exec`.
7. Crie um repositório no GitHub, envie o conteúdo de `site/` na raiz, e ative **Settings → Pages → Deploy from branch (main /root)**.
8. Acesse `https://SEU-USUARIO.github.io/SEU-REPO/`. Não é preciso configurar CORS.

## Uso
- Novo artigo → preencha, monte exatamente 3 perguntas → **Publicar**. Rascunhos aceitam menos de 3. Data de publicação futura agenda o artigo.

## Segurança
Senha validada só no servidor (hash SHA-256 iterado + salt em Propriedades do Script); token de sessão aleatório guardado hasheado no cache (2 h), mantido **apenas em memória** no navegador (recarregar a página exige novo login); todas as ações admin exigem sessão; bloqueio global após 5 senhas erradas (15 min); HTML sanitizado no servidor por lista de tags permitidas; gabarito nunca sai na API pública; respostas de visitantes não são enviadas nem guardadas.

## Limitações
Cotas gratuitas do Apps Script; primeira chamada pode demorar (cold start); bloqueio de login é global (senha única); sessão pode ser perdida se o cache do Google for limpo; não há cache de listagem.

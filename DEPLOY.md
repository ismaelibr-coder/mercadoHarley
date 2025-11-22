# Guia de Deploy - Mercado Harley 🚀

Este guia vai te ajudar a colocar o Mercado Harley no ar em produção! Vamos usar **Vercel** para o Frontend e **Render** para o Backend.

---

## 1. Preparação (Antes de começar)

### Instalar Git (Se não tiver)
Parece que você não tem o Git instalado. Baixe e instale:
- [Git para Windows](https://git-scm.com/download/win)
- Durante a instalação, marque a opção "Git Bash Here" e "Add to PATH".

### Configurar Repositório
Certifique-se de que seu projeto está no **GitHub**. Se ainda não estiver:
1. Crie um repositório no GitHub.
2. Abra o terminal (ou Git Bash) na pasta do projeto.
3. Execute:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ismaelibr-coder/mercadoHarley.git
   git push -u origin main
   ```

---

## 2. Deploy do Backend (Render)

O backend precisa subir primeiro para termos a URL da API.

1. Crie uma conta em [render.com](https://render.com).
2. Clique em **New +** -> **Web Service**.
3. Conecte seu repositório do GitHub.
4. Configure:
   - **Name:** `mercado-harley-api` (ou outro nome)
   - **Root Directory:** `backend` (MUITO IMPORTANTE!)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Em **Environment Variables**, adicione:
   - `PORT`: `3001`
   - `FIREBASE_SERVICE_ACCOUNT_PATH`: `/etc/secrets/firebase-service-account.json` (Vamos configurar o arquivo secreto no próximo passo)
   - `MERCADOPAGO_ACCESS_TOKEN`: Seu token do Mercado Pago
   - `FRONTEND_URL`: A URL que o Vercel vai gerar (pode deixar `*` por enquanto ou atualizar depois)

6. **Configurando o Arquivo do Firebase:**
   - No Render, vá na aba **Secret Files**.
   - Clique em **Add Secret File**.
   - **Filename:** `firebase-service-account.json`
   - **Content:** Cole o conteúdo do seu arquivo `serviceAccountKey.json` (que está na pasta `backend`).
   - Clique em **Save**.

7. Clique em **Create Web Service**.
8. Aguarde o deploy. Copie a URL gerada (ex: `https://mercado-harley-api.onrender.com`).

---

## 3. Deploy do Frontend (Vercel)

1. Crie uma conta em [vercel.com](https://vercel.com).
2. Clique em **Add New...** -> **Project**.
3. Importe seu repositório do GitHub.
4. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `./` (padrão)
5. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: A URL do seu backend no Render (ex: `https://mercado-harley-api.onrender.com`)
   - **Importante:** Não coloque a barra `/` no final da URL.
6. Clique em **Deploy**.

---

## 4. Finalização

1. Após o deploy do Frontend, copie a URL do site (ex: `https://mercado-harley.vercel.app`).
2. Volte no **Render (Backend)** -> **Environment Variables**.
3. Atualize a variável `FRONTEND_URL` com a URL do Vercel.
4. O Render vai reiniciar automaticamente.

---

## 🎉 Parabéns!

Seu site deve estar no ar! Teste:
- Carregamento dos produtos
- Login (se houver)
- Checkout

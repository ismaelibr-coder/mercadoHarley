# 🚀 Guia de Deploy para Produção - Mercado Harley

Siga estes passos para colocar seu site no ar!

## 1. Preparação (Backend)

O backend precisa estar online para processar pagamentos. Vamos usar o **Render** (gratuito e fácil).

1. Crie uma conta em [render.com](https://render.com).
2. Clique em **"New +"** -> **"Web Service"**.
3. Conecte seu repositório do GitHub (se tiver) ou escolha "Public Git Repository" se for público.
4. **Configurações:**
   - **Name:** `mercado-harley-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. **Variáveis de Ambiente (Environment Variables):**
   Adicione as seguintes chaves (copie do seu `.env` local):
   - `MERCADOPAGO_ACCESS_TOKEN`: (Seu token de produção)
   - `MERCADOPAGO_PUBLIC_KEY`: (Sua chave pública de produção)
   - `FIREBASE_SERVICE_ACCOUNT_PATH`: (Conteúdo do JSON ou caminho - *Dica: No Render, use "Secret Files" para subir o arquivo json*)
   - `RESEND_API_KEY`: (Sua chave do Resend)
   - `FRONTEND_URL`: (A URL que você vai gerar no passo 2, ex: `https://mercado-harley.vercel.app`)

## 2. Deploy do Frontend (Vercel)

1. Instale a CLI da Vercel (se não tiver):
   ```bash
   npm i -g vercel
   ```

2. Faça login:
   ```bash
   vercel login
   ```

3. Na pasta raiz do projeto (`mercado-harley`), rode:
   ```bash
   vercel
   ```

4. Responda as perguntas:
   - Set up and deploy? **Y**
   - Which scope? (Selecione sua conta)
   - Link to existing project? **N**
   - Project name? `mercado-harley`
   - Directory? `./` (Enter)
   - Want to modify settings? **N**

5. **Configurar Variáveis na Vercel:**
   Vá no painel da Vercel (Project Settings -> Environment Variables) e adicione:
   - `VITE_API_URL`: (A URL do seu backend no Render, ex: `https://mercado-harley-backend.onrender.com`)
   - `VITE_MERCADOPAGO_PUBLIC_KEY`: (Sua chave pública de produção)

6. **Redeploy:**
   Após adicionar as variáveis, rode novamente no terminal:
   ```bash
   vercel --prod
   ```

## 3. Finalização

1. Pegue a URL final do frontend (ex: `https://mercado-harley.vercel.app`).
2. Volte no **Render (Backend)** e atualize a variável `FRONTEND_URL` com esse link.
3. Volte no **Mercado Pago** e configure o Webhook para `https://seu-backend.onrender.com/api/webhooks/mercadopago`.

**Pronto! Seu e-commerce está no ar com pagamentos reais!** 🚀

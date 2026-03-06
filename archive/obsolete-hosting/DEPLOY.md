# Deploy (Produção)

Passos resumidos para subir a aplicação em produção.

## 1) Backend (no VPS)
- Garanta que `/home/app/mercado-harley/backend/.env` esteja configurado corretamente (`DB`, `RESEND_API_KEY`, `JWT_SECRET`, `PORT=3001`).
- Copie `backend/ecosystem.config.js` para o diretório `backend/` no servidor.
- No VPS, rode:

```bash
cd /home/app/mercado-harley/backend
pm2 start ecosystem.config.js --env production --update-env
pm2 save
```

## 2) Frontend — build
- O build do frontend deve ser gerado localmente ou via CI (arquivos estáticos em `dist/`).
- No repositório, execute:

```bash
# Se houver package-lock.json, prefira:
npm ci
# Caso não exista package-lock.json, use:
npm install

npm run build
```

Nota: o comando `npm ci` falha se não houver `package-lock.json` (foi esse o erro visto quando você rodou em `/root`). Rode os comandos acima na raiz do projeto.

## 3) Deploy para Hostinger (SFTP / rsync)

Recomendo subir o conteúdo de `dist/` para a pasta `public_html` do Hostinger. Criei um script auxiliar em `scripts/deploy-frontend.sh` que suporta `rsync` (via SSH) ou SFTP (via `lftp` ou `sshpass`).

Exemplos de uso (execute localmente na raiz do repo):

```bash
# Usando rsync + chave SSH (recomendado se o Hostinger permitir SSH/rsync):
HOST=meu_hostinger.com USER=usuario REMOTE_PATH=/home/usuario/public_html PORT=22 METHOD=rsync SSH_KEY=~/.ssh/id_rsa ./scripts/deploy-frontend.sh

# Usando SFTP com senha (se o Hostinger só oferecer SFTP):
HOST=meu_hostinger.com USER=usuario PASSWORD='sua_senha' REMOTE_PATH=/home/usuario/public_html METHOD=sftp ./scripts/deploy-frontend.sh
```

Se o Hostinger não disponibilizar SSH/rsync, use o cliente SFTP do painel (File Manager) ou um cliente GUI (FileZilla/WinSCP) para enviar os arquivos de `dist/`.

## 4) Deploy automatizado (opcional)
- O script `scripts/deploy-backend.sh` (quando usado com as variáveis de ambiente corretas) pode puxar a última versão no VPS e reiniciar o PM2. Requer SSH com chave configurada.

Exemplo:

```bash
DEPLOY_HOST=187.77.62.63 DEPLOY_USER=root DEPLOY_PATH=/home/app/mercado-harley ./scripts/deploy-backend.sh
```

## 5) Verificações pós-deploy
- Verifique logs: `pm2 logs mercado-harley-backend --lines 200`
- Teste `POST /api/auth/forgot-password` para confirmar envio de e-mail.
- No frontend, faça login com a senha temporária e confirme `localStorage.getItem('auth_token')` existe.

## 6) Segurança
- Revogue ou rotacione chaves expostas (Resend). Mantenha chaves em variáveis de ambiente seguras.

---

Se quiser, eu posso executar o upload do `dist/` para o Hostinger (faço localmente aqui e envio) — preciso apenas das credenciais SFTP/SSH e do caminho remoto.

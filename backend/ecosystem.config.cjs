// PM2 process definition for the backend, versioned so the deploy topology is
// auditable and reproducible from a clean clone (previously this file was
// referenced by scripts/deploy-backend.sh but didn't exist in the repo — deploys
// silently fell back to a bare `pm2 start server.js`). No secrets belong here:
// server.js loads its own .env file, so PM2 doesn't need to inject anything.
module.exports = {
  apps: [
    {
      name: 'mercado-harley-backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

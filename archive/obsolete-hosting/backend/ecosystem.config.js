module.exports = {
  apps: [
    {
      name: 'mercado-harley-backend',
      script: './server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      watch: false,
      max_restarts: 10,
      error_file: '/root/.pm2/logs/mercado-harley-backend-error.log',
      out_file: '/root/.pm2/logs/mercado-harley-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z'
    }
  ]
};

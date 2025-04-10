module.exports = {
  apps: [
    {
      name: 'main-app',
      script: 'your-main-app-start-file.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'scheduler',
      script: 'scheduler.js',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};

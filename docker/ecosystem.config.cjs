module.exports = {
  apps: [{
    name: "social-appliance",
    script: "./packages/server/dist/index.js",
    instances: process.env.PM2_INSTANCES || "max",
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: process.env.PORT || 8080
    },
    error_file: "/dev/stderr",
    out_file: "/dev/stdout",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s",
    max_memory_restart: "500M"
  }]
};

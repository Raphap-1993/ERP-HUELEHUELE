const webPort = Number(process.env.WEB_PORT || 3000);
const adminPort = Number(process.env.ADMIN_PORT || 3005);
const apiPort = Number(process.env.API_PORT || 4000);
const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || 5);
const appRelease = process.env.APP_RELEASE_SHA || "dev";

function withBaseEnv(overrides = {}) {
  return {
    NODE_ENV: "production",
    APP_RELEASE_SHA: appRelease,
    ...overrides
  };
}

module.exports = {
  apps: [
    {
      name: "huelegood-web",
      cwd: "./apps/web",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "512M",
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      kill_timeout: 10000,
      out_file: "../../logs/web.out.log",
      error_file: "../../logs/web.error.log",
      env: withBaseEnv({
        PORT: webPort
      }),
      env_production: withBaseEnv({
        PORT: webPort
      })
    },
    {
      name: "huelegood-admin",
      cwd: "./apps/admin",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "512M",
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      kill_timeout: 10000,
      out_file: "../../logs/admin.out.log",
      error_file: "../../logs/admin.error.log",
      env: withBaseEnv({
        PORT: adminPort
      }),
      env_production: withBaseEnv({
        PORT: adminPort
      })
    },
    {
      name: "huelegood-api",
      cwd: "./apps/api",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "768M",
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      kill_timeout: 10000,
      out_file: "../../logs/api.out.log",
      error_file: "../../logs/api.error.log",
      env: withBaseEnv({
        PORT: apiPort
      }),
      env_production: withBaseEnv({
        PORT: apiPort
      })
    },
    {
      name: "huelegood-worker",
      cwd: "./apps/worker",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "512M",
      restart_delay: 5000,
      exp_backoff_restart_delay: 200,
      kill_timeout: 10000,
      out_file: "../../logs/worker.out.log",
      error_file: "../../logs/worker.error.log",
      env: withBaseEnv({
        WORKER_CONCURRENCY: workerConcurrency
      }),
      env_production: withBaseEnv({
        WORKER_CONCURRENCY: workerConcurrency
      })
    }
  ]
}

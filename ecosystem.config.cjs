const path = require("node:path");

const appBaseDir = process.env.APP_BASE_DIR ? path.resolve(process.env.APP_BASE_DIR) : __dirname;
const appLogDir = process.env.APP_LOG_DIR ? path.resolve(process.env.APP_LOG_DIR) : path.join(appBaseDir, "logs");
const webPort = Number(process.env.WEB_PORT || 3000);
const adminPort = Number(process.env.ADMIN_PORT || 3005);
const apiPort = Number(process.env.API_PORT || 4000);
const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || 5);
const appRelease = process.env.APP_RELEASE_SHA || "dev";

function resolveAppPath(...segments) {
  return path.join(appBaseDir, ...segments);
}

function resolveLogPath(filename) {
  return path.join(appLogDir, filename);
}

function withBaseEnv(overrides = {}) {
  return {
    NODE_ENV: "production",
    APP_RELEASE_SHA: appRelease,
    APP_BASE_DIR: appBaseDir,
    APP_LOG_DIR: appLogDir,
    ...overrides
  };
}

module.exports = {
  apps: [
    {
      name: "huelegood-web",
      cwd: resolveAppPath("apps", "web"),
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
      out_file: resolveLogPath("web.out.log"),
      error_file: resolveLogPath("web.error.log"),
      env: withBaseEnv({
        PORT: webPort
      }),
      env_production: withBaseEnv({
        PORT: webPort
      })
    },
    {
      name: "huelegood-admin",
      cwd: resolveAppPath("apps", "admin"),
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
      out_file: resolveLogPath("admin.out.log"),
      error_file: resolveLogPath("admin.error.log"),
      env: withBaseEnv({
        PORT: adminPort
      }),
      env_production: withBaseEnv({
        PORT: adminPort
      })
    },
    {
      name: "huelegood-api",
      cwd: resolveAppPath("apps", "api"),
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
      out_file: resolveLogPath("api.out.log"),
      error_file: resolveLogPath("api.error.log"),
      env: withBaseEnv({
        PORT: apiPort
      }),
      env_production: withBaseEnv({
        PORT: apiPort
      })
    },
    {
      name: "huelegood-worker",
      cwd: resolveAppPath("apps", "worker"),
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
      out_file: resolveLogPath("worker.out.log"),
      error_file: resolveLogPath("worker.error.log"),
      env: withBaseEnv({
        WORKER_CONCURRENCY: workerConcurrency
      }),
      env_production: withBaseEnv({
        WORKER_CONCURRENCY: workerConcurrency
      })
    }
  ]
}

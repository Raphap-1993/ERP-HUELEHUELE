module.exports = {
  apps: [
    {
      name: "huelegood-web",
      cwd: "./apps/web",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "huelegood-admin",
      cwd: "./apps/admin",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "huelegood-api",
      cwd: "./apps/api",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 4000
      }
    },
    {
      name: "huelegood-worker",
      cwd: "./apps/worker",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        WORKER_CONCURRENCY: 5
      }
    }
  ]
}

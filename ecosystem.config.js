module.exports = {
  apps: [
    {
      name: "signshop",
      // Use the directory of this file as the app cwd so the PM2 config is portable.
      // On DirectAdmin the uploaded app root should contain this file.
      cwd: __dirname,
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
}

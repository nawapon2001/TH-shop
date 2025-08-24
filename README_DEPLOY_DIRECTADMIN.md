DirectAdmin deployment notes

Quick steps to deploy this Next.js app on DirectAdmin (Node.js apps) or via SSH+PM2:

1) Prepare archive for upload
   - From your local machine create a zip or tar.gz of the project root (omit node_modules):
     - zip: zip -r signshop.zip . -x node_modules/**\* .git/**\*
     - tar: tar -czf signshop.tar.gz --exclude=node_modules --exclude=.git .

2) Upload archive to DirectAdmin file manager and extract into the app folder.

3) Environment variables
   - Option A (DirectAdmin Node App manager): open the app in DirectAdmin and add variables one-by-one (Name + Value). Use the names from `.env.production.example`.
   - Option B (SSH): create a `.env.production` file in the app root with the same keys (we include an example `.env.production` file in the repo).

4) Run the deploy script (SSH)
   - After extracting the archive, run:
     bash deploy_directadmin.sh /path/to/app/root
   - This will run `npm ci`, `npm run build`, and `pm2 startOrReload ecosystem.config.js`.

5) If DirectAdmin runs the app for you, ensure the 'Start Command' is `npm start` and that `PORT` and `NODE_ENV` are set.

Backfill note: to add seller metadata to historical orders run the script `node scripts/backfill-order-sellers.js` after ensuring `MONGO_URI` is set and you have a DB backup.
Quick DirectAdmin / PM2 deployment checklist for signshop-fullstack

1) Prerequisites on the server
   - Node.js (same major version used locally)
   - Git (or upload code via SFTP)
   - PM2 (optional) for process management: `npm i -g pm2`
   - If you use MongoDB Atlas, have `MONGO_URI` ready

2) Deploy the code
   - SSH into the server and place the project under the domain folder (example):
     /home/username/domains/example.com/app
   - Example commands:
     git clone <repo-url> ./app
     cd app
     npm ci

3) Environment variables
   - Use DirectAdmin "Node.js App" manager to set environment variables, or create `.env.production` in the app folder (keep secrets out of git).
   - Use the `.env.production.example` file as a template.

4) Build the Next.js app
   - Run on the server in the app directory:
     npm run build
   - If build fails, check Node version and installed packages.

5) Run the app
   Option A: DirectAdmin Node App manager
     - In DirectAdmin UI, create a Node.js app for the domain, set the app root to your app folder, set env vars, run `npm ci`, `npm run build` and start the app via the UI. DirectAdmin will proxy the domain to the app port.

   Option B: PM2 + reverse proxy (Apache/Nginx)
     - Start with PM2: `pm2 start ecosystem.config.js && pm2 save`
     - Configure Apache/Nginx (provided by DirectAdmin) to reverse-proxy the domain to the app port (3000) or let DirectAdmin map the port.

6) Uploads and storage
   - If the app writes to `public/uploads` ensure the folder is writable by the app user.
   - For production, prefer S3 or remote storage instead of local disk to avoid lost files on redeploy.

7) SSL and domain
   - Use DirectAdmin Let's Encrypt integration to enable HTTPS for the domain.

8) Logs & debugging
   - PM2 logs: `pm2 logs signshop`
   - If using DirectAdmin Node manager, check the App logs in the UI.

9) Permissions & security
   - Never commit `.env.production` to git.
   - Use least-privilege MongoDB user with network whitelist.

10) Optional extras
   - Add `ecosystem.config.js` (included) to start via PM2.
   - Add a small systemd service wrapper if you prefer (PM2 recommended).

If you want, I can:
- Customize `ecosystem.config.js` with your server paths/port and create a ready-to-upload `.env.production` (you must provide values), or
- Provide the exact DirectAdmin UI steps given your DirectAdmin version (tell me if you use the Node.js App manager or prefer PM2 + reverse proxy).

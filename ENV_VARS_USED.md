Environment variables used by this project

Copy these names and add them to DirectAdmin NodeJS App (Name + Value) or put them into `.env.production`.

- MONGO_URI / MONGODB_URI
  - Primary MongoDB connection string. Many files read `process.env.MONGO_URI` or `process.env.MONGODB_URI` (e.g. `src/lib/mongodb.ts`, API routes, scripts/backfill-order-sellers.js).

- DB_NAME
  - Optional DB name used in some routes. Default in examples: `signshop`.

- NODE_ENV
  - Set to `production` on the server.

- PORT
  - The port the Next.js server should listen on. Default: `3000`.

- NEXT_PUBLIC_API_BASE
  - Optional base API URL used by some client code.

- AWS_* or S3_* (optional)
  - If you upload files to S3, code may reference environment variables like `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`.

- STRIPE_* (if used)
  - If you process payments, add stripe keys (e.g. `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`). Check `src/app/checkout` for usage.

Notes:
- Do not commit production credentials to Git. Use DirectAdmin UI to enter secrets or upload `.env.production` only on the server.
- After setting env vars in DirectAdmin or creating `.env.production`, use the `deploy_directadmin.sh` script to install, build, and start the app.

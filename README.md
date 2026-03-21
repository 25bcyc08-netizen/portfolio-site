# Portfolio Site

This repository contains a simple portfolio website with a contact form.

- **Frontend**: static HTML/CSS/JS (`frontend/`)
- **Backend**: serverless APIs using SQLite (see `backend/api/db.js`)
  with a Postgres fallback when `DATABASE_URL` is defined.
  - The logic is shared between serverless functions and the local Express
    server.
  - Data is persisted in a SQLite file (`backend/messages.sqlite` by default)
    but you can set `DB_PATH` or `DATABASE_URL` for other setups.
- **(Optional)** `backend/server.js` is an Express app that runs locally using
  the same database and exposes `/api/contact` and `/api/messages` so the
  frontend never needs to know about ports or origins.

## Local development

1. Clone the repo and navigate to the project root.
2. Install backend dependencies:
   ```powershell
   cd backend
   npm install
   ```
   (the `sqlite3` package is already included).
3. Start the backend server:
   ```powershell
   npm start
   ```
   This will listen on `http://localhost:5000`. The SQLite file will be
   created at `backend/messages.sqlite` unless you override it with `DB_PATH`.
4. Serve the frontend for testing:
   ```powershell
   cd ../frontend
   npx http-server -c-1 . -p 8080
   ```
   The frontend automatically prefixes requests with `/api` and points to
   `http://localhost:5000` when running locally.
5. Open `http://localhost:8080` in your browser and submit the contact form.
   Submitted messages appear under "Submitted Messages"; all API calls go to
   `/api/contact` and `/api/messages`.


## Running the serverless functions locally

Install the Vercel CLI and run:
```powershell
npm i -g vercel
vercel dev
```
This will emulate the `/api/contact` and `/api/messages` routes using the same
code found under `backend/api`.

> **Important:** the built‑in SQLite fallback stores the database in a file.
> On Vercel serverless functions the project folder is read‑only, so the
> helper automatically writes to `/tmp/messages.sqlite`. That file is
> **ephemeral** and will be discarded between deployments or even between
> function invocations. If you want your messages to persist you should:
> 
> 1. Provide a real database by setting the `DATABASE_URL` environment variable
>    (Postgres is supported out of the box). or
> 2. Configure `DB_PATH=/tmp/messages.sqlite` and accept that data is lost
>    whenever the functions spin up a fresh container (not recommended for
>    production).
> 
> The default behaviour makes the app “work” on Vercel, but it’s expected
> that the live server will appear empty after each redeploy or after a short
> period of time; that’s normal for ephemeral storage.

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the repo into Vercel (https://vercel.com/new). The `vercel.json`
   config handles static files and API routing.
3. (Optional) If you want to use Postgres instead of SQLite, set `DATABASE_URL`
   in the project environment variables. Otherwise no variables are required.
4. Trigger a deploy by pushing a commit or clicking "Deploy".
5. Open the deployed site URL on any device.

### Troubleshooting

- If you see `500` errors from the API, check function logs with `vercel logs`.
- Make sure any `DATABASE_URL` you supply is correct and reachable.
- Local development uses CORS on the backend so the frontend can run from a
  different port.

## Notes

- The serverless endpoints use a shared `connect()` helper (`backend/api/db.js`) to
  manage the Mongo connection and avoid reconnecting on every request.
- User-submitted messages are rendered safely using `textContent` to prevent
  XSS.
- The contact form fields include `autocomplete` attributes and basic validation.

## Cleaning up

- Do **not** commit `.env` files or your MongoDB credentials. If you've already
  pushed them, rotate the credentials and remove them from your Git history.

Enjoy your portfolio site! Feel free to customize the HTML/CSS or extend the
backend logic as needed.
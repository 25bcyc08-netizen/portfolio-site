# Portfolio Site

This repository contains a simple portfolio website with a contact form.

- **Frontend**: static HTML/CSS/JS (`frontend/`)
- **Backend**: serverless APIs using SQLite (`backend/api/*.js`)
  - Deployed on Vercel as serverless functions
  - Stores messages in a local SQLite database file (paths can be overridden
    with `DB_PATH` environment variable)
- **(Optional)** `backend/server.js` is an Express app that runs locally using
  the same SQLite database, and it exposes `/api/contact` and `/api/messages`.
  The frontend requests no longer need manual modification when running on a
  different port.

## Local development

1. Clone the repo and navigate to the project root.
2. Install backend dependencies:
   ```powershell
   cd backend
   npm install
   ```
   (the `sqlite3` package is included already; no additional install is
   necessary).
3. Start the backend (this runs the Express server at `http://localhost:5000`):
   ```powershell
   npm start
   ```
   By default the SQLite database file will be created at
   `backend/messages.sqlite`. You can override this with a `DB_PATH`
   environment variable.
4. Serve the frontend for testing:
   ```powershell
   cd ../frontend
   npx http-server -c-1 . -p 8080
   ```
   The frontend script will automatically point requests to `http://localhost:5000/api`.
5. Open the site in your browser and submit the contact form. Messages are
   displayed under "Submitted Messages". API routes remain `/api/contact` and
   `/api/messages`.


## Running the serverless functions locally

Install the Vercel CLI and run the development environment:
```powershell
npm i -g vercel
$env:MONGODB_URI="<your connection string>"
vercel dev
```
This will emulate the `/api/contact` and `/api/messages` routes.

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the repo into Vercel (https://vercel.com/new). The `vercel.json`
   config handles static files and API routing.
3. Add the environment variable:
   - Navigate to **Settings > Environment Variables** in your Vercel project.
   - Add a variable named `MONGODB_URI` with your MongoDB connection string.
   - Set the appropriate scope (Production/Preview/Development).
4. Trigger a deploy by pushing a commit or clicking "Deploy". Wait for the
   deployment to finish.
5. Open the site URL on any device, including your phone.

### Troubleshooting

- If the deployment logs show a `500` error and the message
  `MONGODB_URI not set` or similar, re-check that the environment variable was
  added correctly and the project was redeployed after adding it.
- Ensure your MongoDB Atlas cluster allows connections from Vercel IPs or
  configure the IP whitelist accordingly.
- Use `vercel logs` or the web dashboard to inspect function logs.

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
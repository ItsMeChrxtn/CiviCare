# CiviCare

**Development of a Web-Based Barangay Citizen Engagement and Community Resilience System**

CiviCare is a full-stack MERN application that digitizes barangay civic services: incident reporting, document
requests, community events, donation drives, hazard mapping, emergency preparedness, and real-time notifications —
for Residents, Barangay Officials, and System Administrators.

---

## Tech Stack

**Frontend** — React 19, Vite, Tailwind CSS, React Router DOM, Axios, React Hook Form, React Leaflet, React Icons,
Framer Motion, Chart.js, html5-qrcode, Socket.io Client

**Backend** — Node.js, Express.js, MongoDB Atlas, Mongoose, JWT, Bcrypt, Multer, Cloudinary, Socket.io,
Express Validator, Helmet, CORS, Morgan, Dotenv, Nodemailer, Semaphore SMS API

**Deployment** — Vercel (client), Render (server), MongoDB Atlas (database), GitHub Actions (CI)

---

## Project Structure

```
CiviCare/
├── client/                 # React 19 + Vite frontend
│   └── src/
│       ├── components/     # common, layout, map, charts, qr, chatbot, donation
│       ├── contexts/       # Auth, Socket, Theme, Notification
│       ├── hooks/          # usePaginatedFetch, ...
│       ├── pages/          # public, auth, resident, official, admin, shared
│       ├── routes/         # ProtectedRoute, RoleRoute
│       └── utils/          # api client, constants
├── server/                 # Express + MongoDB backend
│   └── src/
│       ├── config/         # db, cloudinary, socket, constants
│       ├── models/         # 17 Mongoose collections
│       ├── middleware/     # auth, role, error, validate, rateLimiter, upload
│       ├── controllers/    # one per resource + generic CRUD factory
│       ├── routes/         # one per resource + index
│       ├── services/       # email, sms, pdf, qrcode, cloudinary, excel, log, archive
│       ├── validators/     # express-validator chains
│       ├── seeders/        # baseline + sample data
│       └── utils/          # ApiError, ApiResponse, ApiFeatures, tokens
├── render.yaml              # Render blueprint (backend)
└── .github/workflows/ci.yml # CI: install/build both apps
```

---

## Local Setup

### 1. Prerequisites
- Node.js 18+
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [Cloudinary](https://cloudinary.com) account (image/PDF uploads)
- A free [Semaphore](https://semaphore.co) account (SMS, optional — the app degrades gracefully without it)
- An email account with an app password for [Nodemailer](https://nodemailer.com) (e.g. Gmail)

### 2. Backend

```bash
cd server
cp .env.example .env     # fill in MONGO_URI, JWT secrets, Cloudinary, email, Semaphore
npm install
npm run seed              # creates baseline data + sample admin/official/resident accounts
npm run dev                # http://localhost:5000
```

Seeded accounts (also printed to the console after `npm run seed`):

| Role     | Email                       | Password         |
|----------|------------------------------|-------------------|
| Admin    | admin@civicare.gov.ph        | Admin@12345       |
| Official | captain@civicare.gov.ph      | Official@12345    |
| Resident | resident@civicare.gov.ph     | Resident@12345    |

### 3. Frontend

```bash
cd client
cp .env.example .env      # VITE_API_URL, VITE_SOCKET_URL
npm install
npm run dev                # http://localhost:5173
```

---

## Deployment

### Database — MongoDB Atlas
1. Create a free M0 cluster.
2. Add a database user and allow network access from `0.0.0.0/0` (or Render's static IPs).
3. Copy the connection string into `MONGO_URI`.

### Backend — Render
1. Push this repo to GitHub.
2. In Render, choose **New > Blueprint** and point it at this repo (`render.yaml` at the root configures the
   `civicare-api` web service automatically), or create a Web Service manually with:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
3. Set the environment variables marked `sync: false` in `render.yaml` (Mongo URI, Cloudinary, email, Semaphore,
   `CLIENT_URL` pointing at your Vercel domain).
4. After first deploy, run `npm run seed` via the Render shell (or a one-off job) to populate baseline data.

### Frontend — Vercel
1. Import the repo into Vercel, set the project root to `client`.
2. Framework preset: Vite (auto-detected via `vercel.json`).
3. Set environment variables:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
   - `VITE_SOCKET_URL=https://<your-render-service>.onrender.com`
4. Deploy. Update the backend's `CLIENT_URL` to match the resulting Vercel domain (required for CORS + cookies).

### CI — GitHub Actions
`.github/workflows/ci.yml` installs and sanity-builds both apps on every push/PR to `main`/`develop`.

---

## Security

Helmet, CORS allow-list, JWT access + httpOnly refresh cookie, bcrypt password hashing, express-rate-limit
(global + strict auth limiter), express-validator input validation, express-mongo-sanitize, xss-clean, hpp,
role-based access control, and an audit log (`Log` collection) for every write action.

## Real-time

Socket.io authenticates each connection with the JWT access token and joins the socket to a `user:<id>` and
`role:<role>` room, so notifications can be pushed to a single user or broadcast to every official/resident.

## License

MIT — built as a BSIT capstone project reference implementation.

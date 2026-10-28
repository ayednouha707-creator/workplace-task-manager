# Workplace Task Manager

A web app for a small team to assign and follow tasks. I built it during my internship, after noticing the team had no simple way to track who was working on what.

**Stack:** HTML / CSS / JavaScript (front end) · Node.js + Express (REST API) · MongoDB with Mongoose · JWT authentication · bcrypt password hashing

## Features

- No public sign-up: accounts are created by the admin in the company database
- Login with employee ID and password; on first login the user must change the temporary password
- Role-based access, enforced in the API (JWT middleware):
  - **Admin:** create and assign tasks, follow their progress, read comments
  - **Employee:** see only their own tasks, update the status, add comments

## Project structure

```
client/                 static front end (login, admin, employee, change-password pages)
  js/config.js          API base URL
server/
  server.js             Express app
  routes/               auth, tasks, users
  models/               User, Task (Mongoose)
  middleware/auth.js    JWT check + role guard
  scripts/seed.js       demo data
```

## Run it

Requirements: Node.js 18+, MongoDB (local or Atlas).

```bash
cd server
npm install
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm run seed              # optional demo data
npm run dev               # API on http://localhost:5000/api
```

Then open `client/login.html` with a static server (for example VS Code Live Server).

The seed script creates demo accounts with fictional names (`ADM001 / Admin@123`, `EMP101` and `EMP102 / Temp@123`). They are for local testing only.

## Author

Nouha Ayed — ISET Bizerte

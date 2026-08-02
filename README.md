# 🔐 Web Application Brute Force Attack Simulator

> **⚠️ EDUCATIONAL USE ONLY** — This project is strictly for learning how brute-force attacks work and why rate limiting is essential. Never use this against any real system or service you do not own.

A full-stack, interactive cybersecurity demonstration that shows the **contrast between a vulnerable and a secured authentication system** under a live brute-force attack — all visualized through a real-time attack dashboard.

---

## 📌 Table of Contents

- [Project Overview](#-project-overview)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Port Map](#-port-map)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [How to Run](#-how-to-run)
- [How to Use the Attack Dashboard](#-how-to-use-the-attack-dashboard)
- [Project Structure](#-project-structure)
- [Security Concepts Demonstrated](#-security-concepts-demonstrated)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Project Overview

This project is split into **three independent, runnable modules**:

| Module | Description |
|---|---|
| `vulnerable/` | An unprotected Node.js + MongoDB auth backend. Stores passwords as **plain text**, has **no rate limiting** — a perfect brute-force target. |
| `secure/` | A hardened backend with **Argon2 password hashing** and **express-rate-limit** (5 attempts per minute per IP). It actively blocks brute-force. |
| `attack/` | An interactive React dashboard + Node.js dispatch server. Configure targets, pick a wordlist or custom character set, and watch the attack unfold in real-time. |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        ATTACK MODULE                             │
│  attack-ui  (React, Port 5000)  →  attack-server (Node, :3001)  │
│                          │                                       │
│                          │  POST /login (HTTP)                   │
│            ┌─────────────┴──────────────┐                        │
│            ▼                            ▼                        │
│   VULNERABLE TARGET              SECURE TARGET                   │
│  vulnerable/web  (:5002)        secure/web  (:5001)              │
│  vulnerable/backend (:3000)     secure/backend (:4000)           │
│        │                               │                         │
│   MongoDB: vulnerable_db          MongoDB: secure_db             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Technology Stack

### Backend (All Modules)
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js v5
- **Database**: MongoDB (via Mongoose v9)

### Vulnerable Backend Specifics
- Plain-text password storage (intentionally insecure)
- No rate limiting

### Secure Backend Specifics
- **`argon2`** — Industry-standard password hashing (memory-hard, resistant to GPU/ASIC cracking)
- **`express-rate-limit`** — 5 login attempts per IP per 60 seconds; returns HTTP 429 on violation

### Attack Server
- **Express.js** — Provides `/api/start`, `/api/stop`, `/api/logs`, `/api/status` REST endpoints
- Uses Node.js native `fetch` to fire HTTP login requests against the target

### Frontend (All UIs)
- **React 19** — Component-based UI
- **Vite 8** — Dev server & bundler

---

## 🌐 Port Map

| Service | Port | URL |
|---|---|---|
| Attack UI (Dashboard) | `5000` | http://localhost:5000 |
| Secure Web UI | `5001` | http://localhost:5001 |
| Vulnerable Web UI | `5002` | http://localhost:5002 |
| Attack API Server | `3001` | http://localhost:3001 |
| Vulnerable Backend API | `3000` | http://localhost:3000 |
| Secure Backend API | `4000` | http://localhost:4000 |

---

## ✅ Prerequisites

Before you start, make sure you have the following installed:

1. **Node.js v18 or higher**
   ```bash
   node --version   # Should print v18.x.x or higher
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **MongoDB** running locally on the default port `27017`
   ```bash
   # macOS (Homebrew)
   brew services start mongodb-community

   # Ubuntu / Debian
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   
   # Verify it's running
   mongosh --eval "db.runCommand({ connectionStatus: 1 })"
   ```
   > The backends will auto-create `vulnerable_db` and `secure_db` databases on first launch.

4. *(Optional)* A wordlist file like **`rockyou.txt`** placed inside `attack/attack-server/` for large dictionary attacks. You can download it from [SecLists](https://github.com/danielmiessler/SecLists).

---

## 📦 Installation & Setup

### Step 1 — Clone the Repository
```bash
git clone https://github.com/pushpendra9870/brute-force-attack.git
cd brute-force-attack
```

### Step 2 — Make Scripts Executable
```bash
chmod +x *.sh
```

### Step 3 — Install All Dependencies
Run the single automated installer which installs `npm` packages for **all 6 sub-projects** at once:
```bash
./install.sh
```

This script runs `npm install && npm audit fix` inside each of:
- `attack/attack-server`
- `attack/attack-ui`
- `secure/backend`
- `secure/web`
- `vulnerable/backend`
- `vulnerable/web`

### Step 4 — (Optional) Add a Wordlist
For the **Dictionary Attack** mode, place your wordlist inside the `attack/attack-server/` directory.
A small built-in `password.list` is already selectable in the UI for quick demos.
```bash
# Example: copy rockyou.txt (download separately) into the attack server folder
cp ~/Downloads/rockyou.txt attack/attack-server/rockyou.txt
```

---

## ▶️ How to Run

Open **three separate terminal tabs**, one for each module.

### Terminal 1 — Start the Vulnerable Target
```bash
./start_vulnerable.sh
```
This launches:
- `vulnerable/backend` → API at **http://localhost:3000**
- `vulnerable/web` → UI at **http://localhost:5002**

---

### Terminal 2 — Start the Secure Target
```bash
./start_secure.sh
```
This launches:
- `secure/backend` → API at **http://localhost:4000**
- `secure/web` → UI at **http://localhost:5001**

---

### Terminal 3 — Start the Attack Dashboard
```bash
./start_attack.sh
```
This launches:
- `attack/attack-server` → API at **http://localhost:3001**
- `attack/attack-ui` → Dashboard at **http://localhost:5000**

---

> **To stop any module**, press `Ctrl + C` in its terminal tab.

---

## 🎮 How to Use the Attack Dashboard

1. **Open** http://localhost:5000 in your browser.

2. **Register a test user** first by calling the vulnerable backend:
   ```bash
   curl -X POST http://localhost:3000/register \
     -H "Content-Type: application/json" \
     -d '{"username": "testuser", "password": "password123"}'
   ```

3. In the **Attack Dashboard**, configure:
   | Field | Description |
   |---|---|
   | **Target Form URL** | The login endpoint to attack (e.g. `http://localhost:3000/login` for vulnerable, or `http://localhost:4000/login` for secure) |
   | **Target Username(s)** | Comma-separated usernames to attack (e.g. `testuser, admin`) |
   | **Attack Type** | `Dictionary Attack` (uses a wordlist file) or `Custom Brute Force` (generates all combinations for given chars + length) |
   | **Dictionary / Wordlist** | `password.list` (small, fast) or `rockyou.txt` (large, realistic) |

4. Click **INITIATE ATTACK** and watch the live terminal log.

5. **Observe the difference:**
   - Against `vulnerable/backend` (**port 3000**): The attack runs freely until it finds the password.
   - Against `secure/backend` (**port 4000**): After 5 attempts, the server returns `429 Too Many Requests` and the attack is automatically aborted.

---

## 📁 Project Structure

```
brute-force-attack/
│
├── attack/
│   ├── attack-server/          # Node.js API that runs the brute-force logic
│   │   ├── index.js            # Express server: /api/start, /api/stop, /api/logs, /api/status
│   │   ├── package.json
│   │   └── rockyou.txt         # (NOT in git — add manually)
│   │
│   └── attack-ui/              # React dashboard for configuring & monitoring attacks
│       ├── src/
│       │   ├── App.jsx         # Main dashboard component (config panel + live terminal)
│       │   ├── App.css         # Hacker-themed dark UI styles
│       │   └── main.jsx
│       ├── index.html
│       └── package.json
│
├── vulnerable/
│   ├── backend/                # Insecure Express + MongoDB auth API (port 3000)
│   │   ├── controllers/
│   │   │   └── authController.js   # Plain-text password comparison (intentionally weak)
│   │   ├── models/
│   │   │   └── User.js             # Mongoose User schema
│   │   ├── routes/
│   │   │   └── authRoutes.js       # POST /register, POST /login
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── web/                    # React login/register UI for vulnerable system (port 5002)
│
├── secure/
│   ├── backend/                # Hardened Express + MongoDB auth API (port 4000)
│   │   ├── controllers/
│   │   │   └── authController.js   # Argon2 hashing + secure credential verification
│   │   ├── middlewares/
│   │   │   └── rateLimiter.js      # 5 req/min per IP via express-rate-limit
│   │   ├── models/
│   │   │   └── User.js             # Mongoose User schema
│   │   ├── routes/
│   │   │   └── authRoutes.js       # POST /register, POST /login (rate-limited)
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── web/                    # React login/register UI for secure system (port 5001)
│
├── install.sh                  # Auto-installs npm deps for all 6 sub-projects
├── start_attack.sh             # Launches attack-server + attack-ui
├── start_vulnerable.sh         # Launches vulnerable backend + web
├── start_secure.sh             # Launches secure backend + web
├── .gitignore
└── README.md
```

---

## 🔐 Security Concepts Demonstrated

### 1. Brute-Force / Credential Stuffing
The attack server fires rapid HTTP `POST /login` requests using passwords from a wordlist or combinatorial generator. Without server-side defenses, every request is processed.

### 2. Plain-Text Password Storage (Vulnerable)
The vulnerable backend stores and compares passwords as raw strings. A single database leak exposes every user's password immediately.

### 3. Argon2 Password Hashing (Secure)
Argon2 is a memory-hard hashing algorithm — the **winner of the Password Hashing Competition**. Even if the database is leaked, attackers cannot feasibly reverse the hashes.

### 4. Rate Limiting (Secure)
`express-rate-limit` tracks request counts per IP address. After **5 login attempts in 60 seconds**, the server responds with:
```
HTTP 429 Too Many Requests
{"message": "Too many login attempts, please try again after a minute."}
```
The attack dashboard detects this `429` response and **automatically aborts the attack**, demonstrating how a single middleware stops brute force cold.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `MongooseServerSelectionError` | MongoDB is not running. Start it with `brew services start mongodb-community` (macOS) or `sudo systemctl start mongod` (Linux). |
| `EADDRINUSE` (port already in use) | Another process is using that port. Run `lsof -i :<PORT>` and kill the process, or restart your terminal. |
| `ERROR: Dictionary file 'rockyou.txt' not found` | Place `rockyou.txt` inside `attack/attack-server/`. Use `password.list` for quick testing (already bundled). |
| Attack UI can't connect to attack server | Make sure `start_attack.sh` is running and the server started on port `3001`. Check for errors in that terminal tab. |
| `npm install` fails | Make sure you are using **Node.js v18+**. Run `node --version` to check. |
| `argon2` build fails on install | Install native build tools: macOS → `xcode-select --install`; Linux → `sudo apt install build-essential`. |

---

## 📖 Educational Objective

This project visually demonstrates **why every authentication endpoint must have**:
1. **Rate limiting** — To throttle and block automated credential stuffing.
2. **Strong password hashing** — Plain-text or MD5/SHA1 stored passwords are catastrophically dangerous.
3. **Generic error messages** — Both the secure and vulnerable backends return `"Login failed"` (not `"User not found"`) to prevent username enumeration.

Use this in classroom settings, security workshops, or self-study to intuitively understand the stakes of missing these protections.
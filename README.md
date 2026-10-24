# 🔐 Web Application Brute Force Attack Simulator

> **⚠️ EDUCATIONAL USE ONLY** — This project is strictly for learning how brute-force attacks work and why multi-layered defenses are essential. Never use this against any real system or service you do not own.

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
| `vulnerable/` | An unprotected Node.js + MongoDB auth backend. Stores passwords as **plain text**, has **no rate limiting**, and **no CAPTCHA** — a perfect brute-force target. |
| `secure/` | A hardened system with **Argon2 password hashing**, **express-rate-limit** (5 attempts/min per IP), **Account Lockout Policy** (locks account for 15 minutes after 5 failed attempts with frontend countdown timer), and **Interactive CAPTCHA Bot Protection** on frontend and backend. |
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
- No CAPTCHA or bot verification

### Secure Backend Specifics
- **`argon2`** — Industry-standard password hashing (memory-hard, resistant to GPU/ASIC cracking)
- **`express-rate-limit`** — 5 login attempts per IP per 60 seconds; returns HTTP 429 on violation
- **Account Lockout Policy** — Tracks failed login attempts per account in MongoDB; locks user account for 15 minutes upon 5 consecutive failed attempts (returns HTTP 423 Locked)
- **CAPTCHA Challenge Engine** — Generates dynamic, distorted SVG verification challenges (`GET /captcha`); blocks automated bots without valid single-use tokens (returns HTTP 403 Forbidden)

### Attack Server
- **Express.js** — Provides `/api/start`, `/api/stop`, `/api/logs`, `/api/status` REST endpoints
- Uses Node.js native `fetch` to fire HTTP login requests against the target
- Real-time detection and logging of rate limits (HTTP 429), account lockouts (HTTP 423), and CAPTCHA bot blocks (HTTP 403)

### Frontend (All UIs)
- **React 19** — Component-based UI
- **Vite 8** — Dev server & bundler
- **Secure Web UI**: Features interactive SVG CAPTCHA with instant refresh (🔄), real-time Account Lockout warning panel with a live countdown timer (`MM:SS`), and glassmorphic styling.

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
   - Against `secure/backend` (**port 4000**):
     - **Bot/CAPTCHA Defense**: Blocks automated bot scripts lacking human verification with `HTTP 403 Forbidden`.
     - **IP Rate Limiting**: After 5 attempts within a minute, triggers `HTTP 429 Too Many Requests`.
     - **Account Lockout**: After 5 failed attempts on an account, locks the target for 15 minutes (`HTTP 423 Locked`).

---

## 📁 Project Structure

```
brute-force-attack/
│
├── attack/
│   ├── attack-server/          # Node.js API that runs the brute-force logic
│   │   ├── index.js            # Express server with 429, 423, and 403 defense handling
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
│   │   │   └── authController.js   # Argon2 hashing, CAPTCHA validation & account lockout
│   │   ├── services/
│   │   │   └── captchaService.js   # Dynamic SVG CAPTCHA generator & verification
│   │   ├── middlewares/
│   │   │   └── rateLimiter.js      # 5 req/min per IP via express-rate-limit
│   │   ├── models/
│   │   │   └── User.js             # Mongoose User schema with lockout tracking
│   │   ├── routes/
│   │   │   └── authRoutes.js       # GET /captcha, POST /register, POST /login
│   │   ├── index.js
│   │   └── package.json
│   │
│   └── web/                    # React UI with interactive CAPTCHA & Lockout Timer (port 5001)
│       ├── src/
│       │   ├── components/
│       │   │   ├── login.jsx       # Interactive SVG CAPTCHA + live lockout countdown
│       │   │   └── login.css       # Glassmorphic styles for CAPTCHA and lockout banners
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

### 4. IP-Based Rate Limiting (Secure)
`express-rate-limit` tracks request counts per IP address. After **5 login attempts in 60 seconds**, the server responds with:
```
HTTP 429 Too Many Requests
{"message": "Too many login attempts, please try again after a minute."}
```
The attack dashboard detects this `429` response and automatically aborts the attack.

### 5. Account Lockout Policy (Secure)
While IP-based rate limiting defends against single-source attacks, it fails against **distributed brute force** (where attackers rotate proxies, VPNs, or botnet IPs). The secure backend incorporates an **Account Lockout Policy** directly in MongoDB:
- Tracks consecutive failed login attempts on the targeted user account.
- When failed attempts reach 5, the account is temporarily locked for 15 minutes, returning:
```
HTTP 423 Locked
{"message": "Account has been locked due to excessive failed login attempts. Please try again after 15 minutes."}
```
- The frontend features a live, real-time countdown timer (`MM:SS`) indicating when the lockout period expires.

### 6. Interactive CAPTCHA & Bot Protection (Full-Stack)
Automated brute-force tools (like hydra, custom python scripts, or the attack server) rely on high-speed programmatic HTTP requests.
- **Backend**: Dynamically generates distorted SVG CAPTCHA challenges with single-use tokens (`GET /captcha`). Automatically blocks programmatic requests missing valid verification with `HTTP 403 Forbidden`.
- **Frontend**: The secure login form integrates an interactive glassmorphic CAPTCHA widget with a one-click challenge refresh button (🔄) and validation badge.
- **Attack Simulator**: Recognizes `403 Forbidden` bot mitigation and halts automated attack runs.

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
1. **Interactive CAPTCHA / Bot challenges** — To distinguish between human users and automated brute-force scripts.
2. **Account lockout policy** — To defend user accounts against distributed credential stuffing and proxy-rotated brute-force attacks.
3. **IP-based rate limiting** — To throttle high-frequency automated requests from a single source.
4. **Strong password hashing** — Plain-text or MD5/SHA1 stored passwords are catastrophically dangerous.
5. **Generic error messages** — Both the secure and vulnerable backends return `"Invalid credentials"` (not `"User not found"`) to prevent username enumeration.

Use this in classroom settings, security workshops, or self-study to intuitively understand the stakes of missing these protections.

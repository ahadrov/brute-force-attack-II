# WEB APPLICATION BRUTE FORCE ATTACK SIMULATOR

**Project Report | Educational Cybersecurity Demonstration**  
**Team:** Anmol Khare, Pushpendra Shivhare, Vansh Ray Jain, Dhruv Shrivastava  
**Submitted to:** Abhay Deep Seth  

---

### 1. Introduction
A brute-force attack repeatedly submits candidate passwords to an authentication endpoint until a valid credential is found or attempts are stopped. This project demonstrates the contrast between an intentionally vulnerable login backend and an enterprise-hardened backend incorporating multi-layered defense mechanisms. A live dashboard allows users to configure attack parameters, select a dictionary or permutation mode, monitor real-time attack traffic, and inspect how defenses intervene. The project is designed strictly for educational demonstrations within an isolated local environment owned and authorized by the operator.

---

### 2. Objectives
* Demonstrate how unrestricted login endpoints and plain-text storage leave applications critically exposed to automated attacks.
* Compare raw-string storage with memory-hard **Argon2** cryptographic password hashing.
* Illustrate single-source request throttling using IP-based rate limiting (**HTTP 429 Too Many Requests**).
* Implement and validate an **Account Lockout Policy** (**HTTP 423 Locked**) to neutralize distributed brute-force attacks across rotating proxies and botnets.
* Deploy an **Interactive CAPTCHA & Bot Protection Engine** (**HTTP 403 Forbidden**) across both backend verification and frontend UI to halt automated scripts.
* Provide a live dashboard with configuration controls, status monitoring, and real-time defense detection logs.
* Deliver an intuitive user interface with active visual feedback, including dynamic CAPTCHA challenge rendering and real-time account lockout countdown timers.

---

### 3. Technology Stack
* **Runtime & APIs:** Node.js (v18+), Express.js (v5).
* **Database:** MongoDB with Mongoose (v9).
* **Security & Cryptography:** `argon2` (Password Hashing Competition winner), `express-rate-limit` (middleware), Node.js native `crypto` (dynamic SVG CAPTCHA generator).
* **Frontend:** React (v19), Vite (v8), Vanilla CSS (glassmorphic theme).
* **Attack Engine:** Node.js HTTP dispatcher utilizing native `fetch` with streaming log endpoints and automated defense status categorization.

---

### 4. System Architecture
The system consists of three independent, runnable modules:

1. **Vulnerable Module:** An Express authentication API and MongoDB database where credentials are saved and evaluated in plain text with no rate limiting, lockout, or bot challenge.
2. **Secure Module:** A multi-tier hardened Express API and React client featuring Argon2 password hashing, IP rate limiting (5 attempts/min), MongoDB-backed account lockout (15-minute cooldown upon 5 consecutive failures), and dynamic SVG CAPTCHA bot challenges.
3. **Attack Module:** A React visualizer dashboard paired with an Express attack dispatcher that fires programmatic candidate credentials, monitors reachability, and categorizes HTTP response codes in real time.

| Service | Port | Purpose |
|---|---|---|
| **Attack Dashboard** | `5000` | React attack control panel and live attack terminal log. |
| **Attack API Server** | `3001` | Dispatcher that runs attacks, streams logs, and detects 429, 423, and 403 defenses. |
| **Vulnerable Backend** | `3000` | Unprotected authentication API (plain text, no rate limit). |
| **Vulnerable Web UI** | `5002` *(launch script)* | React Vite interface for testing vulnerable authentication. |
| **Secure Backend** | `4000` | Hardened API with Argon2 hashing, IP rate limiting, account lockout, and CAPTCHA service. |
| **Secure Web UI** | `5001` *(launch script)* | React Vite interface with interactive CAPTCHA, challenge refresh (`🔄`), and live lockout timer. |

> **Port Note:** The start scripts explicitly pass ports 5000, 5001, and 5002 to the three Vite development servers. The launch scripts are the authoritative source of truth for port mapping during local execution.

---

### 5. Main Implementation

#### Vulnerable Authentication
The vulnerable registration controller persists incoming passwords directly as plain-text strings in MongoDB. The login controller searches for the user and performs direct string comparison (`user.password === password`). There is no rate limiter, lockout mechanism, or bot verification. This setup illustrates the catastrophic risks of unthrottled endpoints and database leaks.

#### Secure Authentication
The hardened backend incorporates defense-in-depth:
* **Argon2 Password Hashing:** Replaces plain text with memory-hard hashing resistant to GPU and ASIC acceleration.
* **IP-Based Rate Limiting:** Configured via `express-rate-limit` to restrict requests to 5 per 60 seconds per IP, returning `HTTP 429 Too Many Requests`.
* **Account Lockout Policy:** The Mongoose `User` schema tracks `failedLoginAttempts` and `lockUntil`. Reaching 5 consecutive failed attempts locks the specific user account for 15 minutes, returning `HTTP 423 Locked`.
* **Dynamic CAPTCHA Service:** A standalone SVG generation engine creates noise-distorted alphanumeric challenges (`GET /captcha`). Programmatic attacks that omit valid single-use CAPTCHA tokens are rejected with `HTTP 403 Forbidden`.
* **Generic Error Messages:** Failed logins return identical generic messages to prevent username enumeration.

#### Secure Frontend Interface
The secure web client (`secure/web`) provides full visual integration:
* **Interactive CAPTCHA Widget:** Displays dynamically rendered distorted SVG challenges with a one-click refresh button (`🔄`) and uppercase text formatting.
* **Real-Time Lockout Panel:** Upon receiving an HTTP 423 status, the interface displays an animated lockout warning with a live countdown timer (`MM:SS`) and disables input controls until the lockout period expires.

#### Attack Dashboard and Dispatch Server
The attack dashboard accepts a target endpoint, target username(s), attack type (dictionary or character-set generator), and wordlist selection. The dispatcher conducts reachability health checks, tracks response times, and automatically handles defensive responses:
* Detects **HTTP 429**: Logs IP rate limiting and halts the batch.
* Detects **HTTP 423**: Logs account lockout on the specific user and skips further attempts against that account.
* Detects **HTTP 403**: Logs bot mitigation triggered by CAPTCHA enforcement and terminates automated guessing.

---

### 6. Running the Project

1. **Environment Setup:** Ensure Node.js 18+ and npm are installed, and verify a local MongoDB instance is active on port `27017`.
2. **Clone the Repository:**
   ```bash
   git clone https://github.com/ahadrov/brute-force-attack-II.git
   cd brute-force-attack-II
   ```
3. **Make Scripts Executable:**
   ```bash
   chmod +x *.sh
   ```
4. **Install Dependencies:**
   ```bash
   ./install.sh
   ```
5. **Launch Modules (in three separate terminal tabs):**
   * Terminal 1: `./start_vulnerable.sh` (Vulnerable API at `:3000`, Web at `:5002`)
   * Terminal 2: `./start_secure.sh` (Secure API at `:4000`, Web at `:5001`)
   * Terminal 3: `./start_attack.sh` (Attack API at `:3001`, Dashboard at `:5000`)
6. **Execution:** Open `http://localhost:5000` in the browser, register test accounts, and conduct controlled comparative attack runs.

---

### 7. Security Concepts and Expected Demonstration

* **Against Vulnerable Backend (`:3000`):** Automated password-guessing runs continuously without interruption until the target credential is found or the wordlist is exhausted.
* **Against Secure Backend (`:4000`):**
  * *Bot/CAPTCHA Defense:* Unattended automated attack scripts that do not solve human challenges are blocked with **HTTP 403 Forbidden**.
  * *Single-IP High-Frequency Flood:* Rapid requests from a single client trigger the IP rate limiter, returning **HTTP 429 Too Many Requests**.
  * *Distributed Targeted Attack:* If an attacker attempts to circumvent IP rate limits via multiple IP addresses or proxies against a targeted username, the database-backed account lockout intervenes upon the 5th failed attempt, returning **HTTP 423 Locked** and displaying a live countdown timer on the frontend.

---

### 8. Limitations and Improvements

* **Addressed in this Version:**
  * *Account Lockout Implemented:* Mitigated the vulnerability where distributed proxies could bypass single-IP rate limiters.
  * *Bot Protection Added:* Integrated dynamic SVG CAPTCHA verification to stop programmatic brute-force scripts.
  * *Frontend Integration Completed:* Replaced placeholder pages with complete glassmorphic authentication components featuring dynamic CAPTCHA and live lockout cooldown timers.
* **Future Considerations for Enterprise Environments:**
  * Distributed caching via Redis for multi-instance rate limiting and shared session stores.
  * Multi-Factor Authentication (MFA / TOTP) and hardware security key support (WebAuthn / FIDO2).
  * Automated security auditing, telemetry webhooks, and SIEM alerting for repeated anomaly patterns.

---

### 9. Conclusion
This updated simulator provides a rigorous, visual demonstration of modern authentication defense. While plain-text storage and unprotected endpoints render systems trivial to breach, combining **Argon2 password hashing**, **IP rate limiting**, **database-backed Account Lockout**, and **full-stack CAPTCHA bot verification** establishes a resilient defense-in-depth posture that completely neutralizes automated brute-force and credential-stuffing attacks.

---

### Source Code
**GitHub Repository:** [https://github.com/ahadrov/brute-force-attack-II](https://github.com/ahadrov/brute-force-attack-II)  
*Educational use only. Do not run password-guessing simulations against systems without explicit authorization.*

---
*Brute Force Attack Simulator | Educational Use Only*

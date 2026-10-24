# WEB APPLICATION BRUTE FORCE ATTACK SIMULATOR

**Project Report | Educational Cybersecurity Demonstration**

**Team:** Anmol Khare, Pushpendra Shivhare, Vansh Ray Jain, Dhruv Shrivastava  
**Submitted to:** Abhay Deep Seth  

### 1. Introduction
A brute-force attack repeatedly submits candidate passwords to an authentication endpoint until a valid credential is found or attempts are stopped. This project demonstrates the difference between an intentionally vulnerable login backend and a secured backend. A dashboard lets users configure a target, select a dictionary or generated-password mode, monitor logs, and stop the simulation. The project is intended only for an isolated system owned or explicitly authorized by the operator.

### 2. Objectives
* Demonstrate how unrestricted login attempts expose weak authentication systems.
* Compare plain-text password storage with Argon2 password hashing.
* Show IP-based rate limiting and HTTP 429 responses under repeated login attempts.
* Demonstrate account lockout policies and HTTP 423 responses under repeated failures.
* Show interactive CAPTCHA bot challenges and HTTP 403 responses halting automated attacks.
* Provide a live dashboard with configuration controls, status, and timestamped logs.
* Explain practical controls for reducing brute-force and credential-stuffing risk.

### 3. Technology Stack
Node.js 18+, Express.js 5, MongoDB with Mongoose 9, Argon2, express-rate-limit, React 19, and Vite 8, and dynamic SVG CAPTCHA generator. The attack server uses Node.js fetch to send HTTP POST requests to a selected login endpoint. MongoDB stores the user records.

### 4. System Architecture
The system contains three modules. (1) Vulnerable module: Express authentication API and MongoDB database; passwords are stored and compared as plain text, with no login rate limiter or CAPTCHA. (2) Secure module: a separate Express API and database; passwords are hashed during registration with Argon2 and verified during login, while express-rate-limit allows five login attempts per IP within a 60-second window, an account lockout policy locks accounts after five failed attempts (HTTP 423), and an interactive SVG CAPTCHA blocks automated bots (HTTP 403). (3) Attack module: a React dashboard communicates with a Node.js dispatch API, which sends candidate credentials to the selected target and records status/log messages.

| Service | Port | Purpose |
| :--- | :--- | :--- |
| Attack dashboard | 5000 | React configuration and live log interface |
| Attack API server | 3001 | Starts/stops simulation; exposes status and logs |
| Vulnerable backend | 3000 | Unprotected login API |
| Vulnerable web UI | 5002 (launch script) | Vite frontend development server |
| Secure backend | 4000 | Argon2 authentication, rate limiting, lockout, and CAPTCHA |
| Secure web UI | 5001 (launch script) | Vite frontend development server with CAPTCHA and lockout UI |

Port note: the start scripts explicitly pass ports 5000, 5001, and 5002 to the three Vite servers. The Vite configuration files do not all define those same ports directly, so the launch scripts are the source of truth when starting the project as documented.

---
*Brute Force Attack Simulator | Educational Use Only*

<div style="page-break-after: always;"></div>

### 5. Main Implementation

**Vulnerable authentication**  
The registration controller saves the submitted password directly. Login retrieves the user and compares the submitted password with the stored string. There is no rate-limiting middleware on this route, making repeated attempts possible. This behavior is intentionally insecure and must not be used for real accounts.

**Secure authentication**  
The secure registration controller hashes passwords using argon2.hash(). During login, argon2.verify() checks the submitted password against the stored hash. The login rate limiter is configured for five requests per 60 seconds per IP and returns a “too many login attempts” response when the limit is exceeded (HTTP 429). In addition, an account lockout policy tracks consecutive failed attempts per account and temporarily locks the account for 15 minutes upon five failures (HTTP 423), displayed with a live countdown timer on the frontend. A dynamic SVG CAPTCHA challenge verifies human interaction and blocks automated bots (HTTP 403). Hashing increases the cost of offline password guessing but does not make weak passwords uncrackable.

**Attack dashboard and dispatch server**  
The dashboard accepts a target login URL, one or more usernames, attack type, dictionary filename, character set, and password length. Dictionary mode reads non-empty lines from a selected wordlist; custom mode generates combinations from the chosen characters and length. The dispatch server checks target reachability, sends login requests, records timestamped logs, exposes status/log endpoints, and supports stopping the run. It actively detects and logs HTTP 429 (rate limit), HTTP 423 (account lockout), and HTTP 403 (CAPTCHA challenge). The log list is capped at 500 entries.

### 6. Running the Project
1. Install Node.js 18+ and npm, and start a local MongoDB service.
2. Clone the repository and enter its folder: `git clone https://github.com/ahadrov/brute-force-attack-II.git`
3. Make shell scripts executable where supported: `chmod +x *.sh`
4. Install dependencies using `./install.sh`.
5. Start the vulnerable module with `./start_vulnerable.sh`, the secure module with `./start_secure.sh`, and the attack module with `./start_attack.sh`. Keep each running in its own terminal.
6. Use the dashboard only against the local demonstration backends. Confirm the target URL and use a small test wordlist for a controlled classroom demonstration.

### 7. Security Concepts and Expected Demonstration
Against the vulnerable backend, repeated incorrect attempts can continue because no rate limiter is applied. Against the secure backend, repeated attempts from the same IP trigger the configured rate limit (HTTP 429), repeated failed attempts against an individual account trigger account lockout (HTTP 423), and automated requests lacking CAPTCHA verification trigger bot protection (HTTP 403). This is the expected behavior based on the implementation, not a claim of measured test results. Record actual attempt counts, timestamps, HTTP statuses, and screenshots during the live run before reporting performance figures.

### 8. Limitations and Improvements
* The secure frontend has been updated with active login/register integration, featuring dynamic CAPTCHA challenge rendering and real-time account lockout countdown timers.
* Account-based throttling and lockout (HTTP 423) and CAPTCHA bot defense (HTTP 403) have been added to prevent IP-based rate limiter bypass by distributed sources; production systems may further consider MFA and progressive delays.
* The attack server treats an HTTP-success response as a candidate success, so robust validation should inspect the response body and authentication outcome explicitly.
* Custom combination generation can become computationally enormous as character-set size and password length increase; use small limits in demonstrations.
* The installer runs npm audit fix automatically, which may change dependency versions. Review changes and test the project after installation.
* No benchmark or measured success-rate data is included in this report because no verified execution results were supplied.

---
*Brute Force Attack Simulator | Educational Use Only*

<div style="page-break-after: always;"></div>

### 9. Conclusion
The simulator illustrates why login endpoints need layered protection. Plain-text password storage increases the impact of a database compromise, while Argon2 protects stored password representations, rate limiting restricts rapid repeated login attempts, and account lockout with CAPTCHA verification prevents distributed automated guessing. The project provides a practical classroom comparison, but its results should be supported with screenshots and test logs from a controlled local execution.

### Source Code
GitHub repository: **https://github.com/ahadrov/brute-force-attack-II**  
Educational use only. Do not run password-guessing simulations against systems without explicit authorization.

---
*Brute Force Attack Simulator | Educational Use Only*

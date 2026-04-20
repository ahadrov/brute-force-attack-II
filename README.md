# Web Application Brute Force Attack Simulator

An educational cybersecurity project that demonstrates the vulnerabilities of unprotected web servers against brute-force attacks and contrasts them with a secured system utilizing defensive countermeasures like rate limiting.

## 🚀 Project Overview

The project is split into three main, independent modules:

1. **Vulnerable System (`vulnerable/`)**: An unprotected web server and UI. It processes every login request relentlessly, making it highly susceptible to brute forcing.
2. **Secure System (`secure/`)**: A hardened web server utilizing industry-standard defenses to catch, throttle, and ban attackers when it detects malicious rapid login attempts.
3. **Attack Module (`attack/`)**: An interactive dashboard and attack-dispatch server that allows you to configure targets, load dictionary patterns, and visually monitor brute-force strikes in real-time.

---

## 🛠 Prerequisites

Before starting, ensure you have:
* **Node.js** installed on your system.
* A wordlist/dictionary file like the famous `rockyou.txt`. Place your downloaded `rockyou.txt` inside the `attack/attack-server/` directory! *(Note: This file is ignored by Git due to its massive file size).*

---

## 💻 Installation & Setup

We have created an automated setup script that installs all dependencies across the entire project and resolves security vulnerabilities!

1. Open your terminal in the root folder of this repository.
2. Make sure the scripts are executable:
   ```bash
   chmod +x *.sh
   ```
3. Run the installer:
   ```bash
   ./install.sh
   ```

---

## 🎮 How to Run the Modules

Instead of dealing with overlapping ports or tangled logs, the project relies on independent launcher scripts. Open a **new terminal tab** for whichever module you want to run:

### 1. The Attack Dashboard
To launch the Attack Server and UI panel:
```bash
./start_attack.sh
```
*(The UI will open on Port 5000)*

### 2. The Vulnerable Target
To launch the unprotected authentication backend and frontend:
```bash
./start_vulnerable.sh
```
*(The UI will open on Port 5002)*

### 3. The Secured Target
To launch the rate-limited, hardened backend and frontend:
```bash
./start_secure.sh
```
*(The UI will open on Port 5001)*

> **Note:** To stop any running module, simply navigate to its terminal tab and press `Ctrl + C`.

---

## 📖 Educational Objective
This project is **strictly for educational demonstration** of how basic credential stuffing attacks operate behind the scenes, and why rate-limiting is absolutely mandatory for any authentication endpoint.
# Brute Force Attack Simulation

An educational cybersecurity project simulating a web application under a brute-force attack.

## Project Structure

This project consists of three main parts:
- **`vulnerable/`**: A poorly secured web application backend and frontend. Contains vulnerabilities tailored for brute forcing.
- **`secure/`**: A secure version of the web application built with industry-standard defenses (rate limiting, account lockouts).
- **`attack/`**: Contains the Attack Server and UI panel to launch configurable dictionary and combo brute-force attacks against target URLs.

## Quick Start

We have provided a unified startup script to make running everything much easier! The startup script will automatically install missing `node_modules` across all folders and start all the backends and Web UIs simultaneously.

1. Give execution permission to the script (only needed once):
   ```bash
   chmod +x start.sh
   ```
2. Run the script:
   ```bash
   ./start.sh
   ```

*(Press `Ctrl + C` in the terminal to stop all running servers later on).*

## Git / Branch Updates
To commit your changes to GitHub without uploading large files (our `.gitignore` prevents uploading `node_modules` and `rockyou.txt`), simply run the following commands in your terminal:

```bash
git add .
git commit -m "Merged index files and added start script"
git push
```
If you are on a specific branch and pushing for the first time, you might need to use `git push -u origin branch_name` (e.g., `git push -u origin main`).
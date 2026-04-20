#!/bin/bash

echo "-> Starting Vulnerable Module (Server & UI)..."
echo "Press Ctrl+C to shut down."

(cd vulnerable/backend && node index.js) &
(cd vulnerable/web && npm run dev -- --port 5002) &

wait

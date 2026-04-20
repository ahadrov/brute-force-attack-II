#!/bin/bash

echo "-> Starting Secure Module (Server & UI)..."
echo "Press Ctrl+C to shut down."

(cd secure/backend && node index.js) &
(cd secure/web && npm run dev -- --port 5001) &

wait

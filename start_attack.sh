#!/bin/bash

echo "-> Starting Attack Module (Server & UI)..."
echo "Press Ctrl+C to shut down."

(cd attack/attack-server && node index.js) &
(cd attack/attack-ui && npm run dev -- --port 5000) &

wait

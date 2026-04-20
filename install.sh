#!/bin/bash

echo "🚀 Installing dependencies and fixing audits for all modules..."
projects=(
  "attack/attack-server"
  "attack/attack-ui"
  "secure/backend"
  "secure/web"
  "vulnerable/backend"
  "vulnerable/web"
)

for p in "${projects[@]}"; do
  if [ -d "$p" ]; then
    echo "📦 Installing and auditing in $p..."
    (cd "$p" && npm install && npm audit fix)
  fi
done

echo "✅ All dependencies installed and audited successfully!"

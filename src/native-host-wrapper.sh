#!/bin/bash
# Native host wrapper - finds node and runs the actual script

# Add common node locations to PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:$HOME/.nvm/versions/node/*/bin:$PATH"

# Find node
NODE=$(command -v node 2>/dev/null)

if [ -z "$NODE" ]; then
  # Try common locations
  for p in /opt/homebrew/opt/node@*/bin/node /opt/homebrew/bin/node /usr/local/bin/node /usr/bin/node; do
    if [ -x "$p" ]; then
      NODE="$p"
      break
    fi
  done
fi

if [ -z "$NODE" ]; then
  echo '{"success":false,"error":"Node.js not found"}' >&2
  exit 1
fi

# Get the directory where this script is located
DIR="$(cd "$(dirname "$0")" && pwd)"

# Run the actual native host script
exec "$NODE" "$DIR/native-host.js" "$@"

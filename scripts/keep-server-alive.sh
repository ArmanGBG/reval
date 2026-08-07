#!/bin/bash
# Production server with auto-restart watchdog
cd /home/z/my-project/reval

LOG=/tmp/reval-server.log
STANDALONE=./.next/standalone/server.js

# Kill any existing instances
pkill -f "next-server" 2>/dev/null
pkill -f "server.js" 2>/dev/null
pkill -f "reval-watchdog" 2>/dev/null
sleep 2

# Ensure static assets are in standalone dir
if [ ! -f .next/standalone/.next/static/chunks/58c60a5fa6b544da.js ]; then
  echo "Copying static assets to standalone..."
  cp -rn .next/static .next/standalone/.next/ 2>/dev/null
  cp -rn public/* .next/standalone/public/ 2>/dev/null
fi

# Start watchdog in a new session, fully detached
setsid bash -c "
  while true; do
    node $STANDALONE >> $LOG 2>&1
    echo \"[watchdog \$(date)] restart in 3s\" >> $LOG 2>&1
    sleep 3
  done
" < /dev/null > /dev/null 2>&1 &

echo "Server watchdog started. PID: $!"
disown -a

# Wait for ready
for i in $(seq 1 20); do
  if curl -s -o /dev/null "http://127.0.0.1:3000/" 2>/dev/null; then
    echo "Server ready after ${i}s"
    exit 0
  fi
  sleep 1
done
echo "Server failed to start"
exit 1

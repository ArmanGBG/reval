#!/bin/bash
# Persistent dev server with auto-restart
cd /home/z/my-project

LOG=/home/z/my-project/dev.log
NEXT=/home/z/my-project/node_modules/.bin/next

# Kill any existing instances
pkill -f "next dev" 2>/dev/null
pkill -f "reval-watchdog" 2>/dev/null
sleep 2

# Start watchdog in a new session, fully detached
setsid bash -c "
  while true; do
    $NEXT dev -p 3000 >> $LOG 2>&1
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

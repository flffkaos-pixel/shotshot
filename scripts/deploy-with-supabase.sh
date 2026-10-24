#!/bin/bash
export PATH="$HOME/.bun/bin:$PATH"
export XDG_CONFIG_HOME="/mnt/c/Users/나가/AppData/Roaming/xdg.config"

# Build-time public vars (inlined into the client bundle)
export NEXT_PUBLIC_SUPABASE_URL="https://fpqvoqonqicoeldbcjpf.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcXZvcW9ucWljb2VsZGJjanBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNTU2OTAsImV4cCI6MjEwNTYzMTY5MH0.xABjpkkuFsN1dlfxOm9vxfvTBeNRhYyDQr7f5k5Ow0Q"

cd ~/shotshot

# ponytail: clear Next's incremental cache too, otherwise a stale page chunk can be
# reused and the deployed bundle silently misses the source change.
rm -rf .next .open-next

npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion > /tmp/build.log 2>&1
echo "BUILD EXIT: $?"

cd .open-next/server-functions/default
for PKG in "critters" "react-server-dom-webpack@19.2.4" "react-server-dom-turbopack@19.2.4"; do
  NAME=$(echo "$PKG" | sed 's/@[^@]*$//')
  if [ ! -d "node_modules/$NAME" ]; then
    npm install "$PKG" --legacy-peer-deps --no-audit --no-fund > /dev/null 2>&1
    echo "INSTALLED $NAME"
  fi
done
cd ~/shotshot

SIZE=$(stat -c%s .open-next/server-functions/default/handler.mjs 2>/dev/null || echo 0)
echo "handler.mjs size: $SIZE"
if [ "$SIZE" -lt 1000000 ]; then echo "BUILD FAILED"; tail -15 /tmp/build.log; exit 1; fi

npx opennextjs-cloudflare deploy 2>&1 | tail -12

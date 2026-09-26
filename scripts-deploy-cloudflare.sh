#!/bin/bash
export PATH="$HOME/.bun/bin:$PATH"
export XDG_CONFIG_HOME="/mnt/c/Users/나가/AppData/Roaming/xdg.config"
cd ~/shotshot

# 1. Build (esbuild 0.24.2 at root — produces the FULL handler.mjs bundle with all patches inlined)
npx opennextjs-cloudflare build > /tmp/build.log 2>&1
echo "BUILD EXIT: $?"

# 2. Install missing deps into server-functions (npm may repair the tree)
cd .open-next/server-functions/default
for PKG in "critters" "react-server-dom-webpack@19.2.4" "react-server-dom-turbopack@19.2.4"; do
  NAME=$(echo "$PKG" | sed 's/@[^@]*$//')
  if [ ! -d "node_modules/$NAME" ]; then
    npm install "$PKG" --legacy-peer-deps --no-audit --no-fund > /dev/null 2>&1
    echo "INSTALLED $NAME"
  fi
done
cd ~/shotshot

# 3. Verify handler.mjs is the REAL bundle (not a stub)
SIZE=$(stat -c%s .open-next/server-functions/default/handler.mjs 2>/dev/null || echo 0)
echo "handler.mjs size: $SIZE"
if [ "$SIZE" -lt 1000000 ]; then
  echo "ERROR: handler.mjs looks like a stub (< 1MB). Build may have failed."
  tail -20 /tmp/build.log
  exit 1
fi

# 4. Deploy via opennextjs-cloudflare (populateCache + bindings, NO rebuild)
npx opennextjs-cloudflare deploy 2>&1 | tail -14

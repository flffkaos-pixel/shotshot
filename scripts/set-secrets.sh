#!/bin/bash
export PATH="$HOME/.bun/bin:$PATH"
export XDG_CONFIG_HOME="/mnt/c/Users/나가/AppData/Roaming/xdg.config"
cd ~/shotshot

# Set runtime secrets (service role + admin/cron)
printf '%s' 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcXZvcW9ucWljb2VsZGJjanBmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA1NTY5MCwiZXhwIjoyMTA1NjMxNjkwfQ.GoimTIG9CkZPrhWHpdXLFi0J8uRZ1rByvvvMRbzCzqg' | npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY 2>&1 | tail -2
printf '%s' 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2' | npx wrangler secret put CRON_SECRET 2>&1 | tail -2
printf '%s' 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3' | npx wrangler secret put ADMIN_SECRET 2>&1 | tail -2
echo "--- secrets ---"
npx wrangler secret list 2>&1 | tail -8

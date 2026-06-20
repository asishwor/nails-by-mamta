#!/bin/bash
while IFS='=' read -r key value; do
  if [[ -n "$key" && "$key" != \#* ]]; then
    if [[ "$key" == "NEXTAUTH_URL" ]]; then
      echo "Skipping NEXTAUTH_URL for Vercel."
      continue
    fi
    # Strip quotes
    val="${value%\"}"
    val="${val#\"}"
    echo "Pushing $key"
    echo -n "$val" | vercel env add "$key" production || true
    echo -n "$val" | vercel env add "$key" preview || true
    echo -n "$val" | vercel env add "$key" development || true
  fi
done < .env

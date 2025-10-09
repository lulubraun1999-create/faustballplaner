#!/usr/bin/env bash
set -e
cd ~/studio
while true; do
  git add -A
  ts="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
  git commit -m "chore: autosave $ts" || true     # commit nur wenn Änderungen
  git pull --rebase origin main || true           # Konflikte minimieren
  git push origin HEAD:main || true
  sleep 120                                       # alle 2 Minuten
done

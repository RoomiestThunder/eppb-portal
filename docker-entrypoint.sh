#!/bin/sh
set -e
# Applies any pending migrations against whatever DATABASE_URL points at, then starts the server.
# Safe to run on every container start — migrate deploy is a no-op if there's nothing pending.
./node_modules/.bin/prisma migrate deploy --schema=./prisma/schema.prisma
exec node server.js

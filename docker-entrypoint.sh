#!/bin/sh
set -e

# Bring the production database up to the latest schema before serving traffic.
# `migrate deploy` is non-interactive and takes an advisory lock, so parallel
# container starts are safe.
npx prisma migrate deploy

exec node server.js

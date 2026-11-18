#!/bin/bash
P="psql -h /tmp -p 5544 -U postgres"
$P -q -c "drop database if exists cc" -c "create database cc" >/dev/null
$P -d cc -v ON_ERROR_STOP=1 -q -f test/supabase_stub.sql 2>/dev/null
for f in supabase/001_schema.sql supabase/002_functions.sql supabase/003_seed.sql supabase/004_billing.sql; do $P -d cc -v ON_ERROR_STOP=1 -q -f $f >/dev/null || { echo "FAILED $f"; exit 1; }; done
echo db ready

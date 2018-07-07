#!/bin/bash -ue

: ${DB:=vb.sqlite}

if [ -f "$DB" ]; then
  echo "Database file $DB already exists, aborting..."
  exit 1
fi

VOLLEY_DB=$DB VOLLEY_DEBUG=1 QUERY_STRING=action=init ./vb.cgi

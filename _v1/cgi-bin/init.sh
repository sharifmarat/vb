#!/bin/bash -ue

: ${DB:=vb.sqlite}

if [ -f "$DB" ]; then
  echo "Database file $DB already exists, aborting..."
  exit 1
fi

VOLLEY_DB=$DB VOLLEY_DEBUG=1 QUERY_STRING=action=init ./vb.cgi

# temporary add an event and a guest for testing
VOLLEY_DB=$DB VOLLEY_DEBUG=1 QUERY_STRING=action=add_event\&date=test_date\&location=location\&payment_link=tbd ./vb.cgi
VOLLEY_DB=$DB VOLLEY_DEBUG=1 QUERY_STRING=action=add_guest\&event_id=1\&name=guest1\&position=pos1 ./vb.cgi
VOLLEY_DB=$DB VOLLEY_DEBUG=1 QUERY_STRING=action=set_primary_event\&id=1 ./vb.cgi

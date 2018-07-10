#!/bin/bash -ue

db=`mktemp /tmp/vb_XXXXXXXXXX.sqlite`

function finish {
  rm -f $db
}
trap finish EXIT

function assert {
  if [ "$1" != "$2" ]; then
    echo "Expected $2, but got $1"
    echo "FAIL"
    exit 1
  fi
}

export VOLLEY_DB=$db
export VOLLEY_DEBUG=1

echo "Testing initialization..."
assert "`QUERY_STRING=action=init ./vb.cgi`" '{"message": "Tables have been created", "status": 0}' 

echo "Testing unknown action..."
assert "`QUERY_STRING=action=unknown ./vb.cgi`" '{"message": "Configuration error, unknown action.", "status": 1}'
assert "`QUERY_STRING= ./vb.cgi`" '{"message": "Configuration error, action is missing", "status": 1}'

echo "Testing events and add_event..."
assert "`QUERY_STRING=action=events ./vb.cgi`" '{"message": [], "status": 0}'
assert "`QUERY_STRING=action=add_event ./vb.cgi`" '{"message": "Could not add an event, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_event\&date=1 ./vb.cgi`" '{"message": "Could not add an event, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_event\&date=d\&location=loc ./vb.cgi`" '{"message": "Could not add an event, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_event\&payment_link=asdf ./vb.cgi`" '{"message": "Could not add an event, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_event\&date=event1\&location=loc1\&payment_link=tbd ./vb.cgi`" '{"message": "Event has been added", "status": 0}'
assert "`QUERY_STRING=action=events ./vb.cgi`" \
    '{"message": [{"date": "event1", "id": 1, "location": "loc1", "payment_link": "tbd", "primary": false}], "status": 0}'
assert "`QUERY_STRING=action=add_event\&date=event2\&location=loc2\&payment_link=tbd ./vb.cgi`" '{"message": "Event has been added", "status": 0}'
assert "`QUERY_STRING=action=add_event\&date=event3\&location=loc3\&payment_link=tbd ./vb.cgi`" '{"message": "Event has been added", "status": 0}'
assert "`QUERY_STRING=action=events ./vb.cgi`" '{"message": [{"date": "event3", "id": 3, "location": "loc3", "payment_link": "tbd", "primary": false}, '`
                                               `'{"date": "event2", "id": 2, "location": "loc2", "payment_link": "tbd", "primary": false}, '`
                                               `'{"date": "event1", "id": 1, "location": "loc1", "payment_link": "tbd", "primary": false}], "status": 0}'

echo "Testing update event...."
assert "`QUERY_STRING=action=update_event ./vb.cgi`" '{"message": "Could not update an event, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=update_event\&id=99999 ./vb.cgi`" '{"message": "Could not update an event, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=update_event\&id=99999\&date=event3\&location=loc3\&payment_link=tbd ./vb.cgi`" \
  '{"message": "Could not find an event to update", "status": 1}'
assert "`QUERY_STRING=action=update_event\&id=3\&date=event33\&location=loc33\&payment_link=pay33 ./vb.cgi`" \
  '{"message": "Event has been updated", "status": 0}'
assert "`QUERY_STRING=action=events ./vb.cgi`" '{"message": [{"date": "event33", "id": 3, "location": "loc33", "payment_link": "pay33", "primary": false}, '`
                                               `'{"date": "event2", "id": 2, "location": "loc2", "payment_link": "tbd", "primary": false}, '`
                                               `'{"date": "event1", "id": 1, "location": "loc1", "payment_link": "tbd", "primary": false}], "status": 0}'

echo "Testing add_guest...."
assert "`QUERY_STRING=action=add_guest ./vb.cgi`" '{"message": "Could not add a guest, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_guest\&name=b ./vb.cgi`" '{"message": "Could not add a guest, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_guest\&position=pos ./vb.cgi`" '{"message": "Could not add a guest, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=add_guest\&event_id=9999\&name=g1\&position=pos1 ./vb.cgi`" '{"message": "Could not add guest for such event", "status": 1}'
assert "`QUERY_STRING=action=add_guest\&event_id=2\&name=g1\&position=pos1 ./vb.cgi`" \
  '{"message": "Guest has been added", "status": 0}'
assert "`QUERY_STRING=action=add_guest\&event_id=2\&name=g2\&position=pos2 ./vb.cgi`" \
  '{"message": "Guest has been added", "status": 0}'
assert "`QUERY_STRING=action=add_guest\&event_id=2\&name=g3\&position=pos3 ./vb.cgi`" \
  '{"message": "Guest has been added", "status": 0}'
assert "`QUERY_STRING=action=add_guest\&event_id=3\&name=g1_3\&position=pos3_3 ./vb.cgi`" \
  '{"message": "Guest has been added", "status": 0}'


echo "Testing event....."
assert "`QUERY_STRING=action=event ./vb.cgi`" '{"message": "Event not found", "status": 1}'
assert "`QUERY_STRING=action=event\&id=xxxx ./vb.cgi`" '{"message": "Event not found", "status": 1}'
assert "`QUERY_STRING=action=event\&id=9999 ./vb.cgi`" '{"message": "Event not found", "status": 1}'
assert "`QUERY_STRING=action=event\&id=1 ./vb.cgi`" '{"message": {"date": "event1", "guests": [], "id": 1, "location": "loc1", "payment_link": "tbd"}, "status": 0}'
assert "`QUERY_STRING=action=event\&id=3 ./vb.cgi`" '{"message": {"date": "event33", "guests": [{"guest_id": 4, "guest_name": "g1_3", "guest_paid": 0, "guest_position": "pos3_3"}], "id": 3, "location": "loc33", "payment_link": "pay33"}, "status": 0}'
assert "`QUERY_STRING=action=event\&id=2 ./vb.cgi`" '{"message": {"date": "event2", "guests": [{"guest_id": 1, "guest_name": "g1", "guest_paid": 0, "guest_position": "pos1"}, {"guest_id": 2, "guest_name": "g2", "guest_paid": 0, "guest_position": "pos2"}, {"guest_id": 3, "guest_name": "g3", "guest_paid": 0, "guest_position": "pos3"}], "id": 2, "location": "loc2", "payment_link": "tbd"}, "status": 0}'

echo "Testing removing guest...."
assert "`QUERY_STRING=action=remove_guest ./vb.cgi`" '{"message": "Could not remove a guest, fields are missing", "status": 1}'
assert "`QUERY_STRING=action=remove_guest\&id=xxxx ./vb.cgi`" '{"message": "Guest has been removed", "status": 0}'
assert "`QUERY_STRING=action=remove_guest\&id=9999 ./vb.cgi`" '{"message": "Guest has been removed", "status": 0}'
assert "`QUERY_STRING=action=remove_guest\&id=2 ./vb.cgi`" '{"message": "Guest has been removed", "status": 0}'
assert "`QUERY_STRING=action=event\&id=2 ./vb.cgi`" '{"message": {"date": "event2", "guests": [{"guest_id": 1, "guest_name": "g1", "guest_paid": 0, "guest_position": "pos1"}, {"guest_id": 3, "guest_name": "g3", "guest_paid": 0, "guest_position": "pos3"}], "id": 2, "location": "loc2", "payment_link": "tbd"}, "status": 0}'

echo "Primary event....."
assert "`QUERY_STRING=action=event ./vb.cgi`" '{"message": "Event not found", "status": 1}'
assert "`QUERY_STRING=action=add_guest\&name=pr_name\&position=pr_pos ./vb.cgi`" '{"message": "Could not add guest for such event", "status": 1}'
assert "`QUERY_STRING=action=set_primary_event ./vb.cgi`" '{"message": "Could not update primary event, fields are missing.", "status": 1}'
assert "`QUERY_STRING=action=set_primary_event\&id=xxx ./vb.cgi`" '{"message": "Could not set such an event as primary.", "status": 1}'
assert "`QUERY_STRING=action=set_primary_event\&id=4 ./vb.cgi`" '{"message": "Could not set such an event as primary.", "status": 1}'
assert "`QUERY_STRING=action=set_primary_event\&id=3 ./vb.cgi`" '{"message": "Primary event has been updated.", "status": 0}'
assert "`QUERY_STRING=action=event ./vb.cgi`" '{"message": {"date": "event33", "guests": [{"guest_id": 4, "guest_name": "g1_3", "guest_paid": 0, "guest_position": "pos3_3"}], "id": 3, "location": "loc33", "payment_link": "pay33"}, "status": 0}'
assert "`QUERY_STRING=action=event\&id= ./vb.cgi`" '{"message": {"date": "event33", "guests": [{"guest_id": 4, "guest_name": "g1_3", "guest_paid": 0, "guest_position": "pos3_3"}], "id": 3, "location": "loc33", "payment_link": "pay33"}, "status": 0}'
assert "`QUERY_STRING=action=event\&id=\"\" ./vb.cgi`" '{"message": {"date": "event33", "guests": [{"guest_id": 4, "guest_name": "g1_3", "guest_paid": 0, "guest_position": "pos3_3"}], "id": 3, "location": "loc33", "payment_link": "pay33"}, "status": 0}'
assert "`QUERY_STRING=action=add_guest\&name=pr_name\&position=pr_pos ./vb.cgi`" '{"message": "Guest has been added", "status": 0}'
assert "`QUERY_STRING=action=event ./vb.cgi`" '{"message": {"date": "event33", "guests": [{"guest_id": 4, "guest_name": "g1_3", "guest_paid": 0, "guest_position": "pos3_3"}, {"guest_id": 5, "guest_name": "pr_name", "guest_paid": 0, "guest_position": "pr_pos"}], "id": 3, "location": "loc33", "payment_link": "pay33"}, "status": 0}'

assert "`QUERY_STRING=action=set_primary_event\&id=2 ./vb.cgi`" '{"message": "Primary event has been updated.", "status": 0}'
assert "`QUERY_STRING=action=event ./vb.cgi`" '{"message": {"date": "event2", "guests": [{"guest_id": 1, "guest_name": "g1", "guest_paid": 0, "guest_position": "pos1"}, {"guest_id": 3, "guest_name": "g3", "guest_paid": 0, "guest_position": "pos3"}], "id": 2, "location": "loc2", "payment_link": "tbd"}, "status": 0}'

echo "Testing shame....."
assert "`QUERY_STRING=action=shame ./vb.cgi`" '{"message": [{"name": "g2"}], "status": 0}'

echo "TODO: Testing update_guest....."

echo "SUCCESS"

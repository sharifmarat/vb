## Intro

Simple and lightweight application to organize volleyball events.

Sqlite engine is used to manage a database.

`vb.cgi` is rest-like API in python3.

## Dependencies

- python3
- sqlite3
- python
- web server to handle cgi (e.g. apache2, nginx+fastcgi)

## Structure

- `cgi-bin` contains database API
- `css`, `js`, `*.html` are regular html files

## Database API

`vb.cgi` parses form (`QUERY_STRING`) from a web-server and replies with a json.  
Env var `VOLLEY_DB` overwrites default database.  
Env var `VOLLEY_DEBUG` enables debugging.

### API

`action=init` - Initializes a database with tables.

`action=add_event&date=d&location=l3&payment_link=p` - Adds an event.

`action=events` - Returns all events.

`action=update_event&id=3&date=d&location=l3&payment_link=p` - Updates an event.

`action=add_guest&event_id=3&name=n&position=pos` - Adds an event.

`action=event&id=3` - Returns an event with all guests.

`action=remove_guest&id=2` - To remove a guest.

In short a reply to every request fits `{"message": XXX, "status":0}`.  
`status=0` is on success and `message` contains corresponding data.  
`status=1` is on failure and `message` contains an error message.


### Testing

Run:
```
(cd cgi-bin && ./test.sh)
```

### Bootstrapping

To run it locally from the repo root:  
```  
# initialize the database
(cd cgi-bin && ./init.sh)
# start the cgi web server
VOLLEY_DB=cgi-bin/vb.sqlite python3 -m http.server --bind localhost --cgi 8000
```

And now open `localhost:8000` in browser.

### Limitations and TODO

- Event id is hard-coded in `index.html`. It should pass nothing to DB API and a primary event should be used.

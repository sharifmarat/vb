#!/usr/bin/env python3

import sqlite3
import sys
import os
import json
import cgi
import logging

logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger('VB.CGI')

def is_debug():
    return os.getenv("VOLLEY_DEBUG") is not None

def db_file():
    return os.getenv('VOLLEY_DB', 'vb.sqlite')

class VolleyDB:
    def __init__(self):
        self.__connection = sqlite3.connect(db_file())
        self.__connection.execute('PRAGMA foreign_keys = 1')
        self.__cursor = self.__connection.cursor()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        self.__cursor.close()
        self.__connection.close()

    def createTables(self):
        with self.__connection:
            self.__cursor.execute("""
                create table if not exists "events" (
                    id integer primary key autoincrement,
                    date text not null
                        check(
                            typeof("date") = "text" 
                            AND length("date") <= 64),
                    location text not null
                        check(
                            typeof("location") = "text" 
                            AND length("location") <= 64),
                    payment_link text not null
                        check(
                            typeof("payment_link") = "text" 
                            AND length("payment_link") <= 128));""")

            self.__cursor.execute("""
                create table if not exists "primary_event" (
                    id integer primary key check (id = 0),
                    event_id integer not null,
                    foreign key(event_id) references events(id));""")

            self.__cursor.execute("""
                create table if not exists "guests" (
                    id integer primary key autoincrement,
                    event_id integer not null,
                    name text not null
                        check(
                            typeof("name") = "text" 
                            AND length("name") <= 64),
                    position text not null
                        check(
                            typeof("position") = "text" 
                            AND length("position") <= 64),
                    is_paid boolean not null 
                        check (is_paid in (0, 1)),
                    foreign key(event_id) references events(id));""")

    def getEvents(self):
        events = []
        for row in self.__cursor.execute('select events.id, events.date, events.location, events.payment_link, (primary_event.event_id==events.id) from events left join primary_event on primary_event.event_id=events.id order by events.id desc limit 20'):
            events.append({'id':row[0], 'date':row[1], 'location':row[2], 'payment_link':row[3], 'primary': (row[4] == 1)})
        return events

    def addEvent(self, date, location, payment_link):
        with self.__connection:
            self.__cursor.execute('insert into events (date, location, payment_link) values(?,?,?)', (date,location,payment_link))
            return self.__cursor.rowcount == 1

    def updateEvent(self, id, date, location, payment_link):
        with self.__connection:
            self.__cursor.execute('update events set date=?, location=?, payment_link=? where id=?', (date, location, payment_link, id))
            self.__connection.commit()
            return self.__cursor.rowcount == 1

    def setPrimaryEvent(self, event_id):
        with self.__connection:
            self.__cursor.execute('insert or replace into primary_event (id, event_id) values(0,?)', (event_id,))
            self.__connection.commit()
            return self.__cursor.rowcount == 1

    def addGuest(self, event_id, guest_name, position):
        with self.__connection:
            if event_id is not None:
                self.__cursor.execute('insert into guests (event_id, name, position, is_paid) values(?,?,?,0)', (event_id, guest_name, position))
            else:
                self.__cursor.execute('insert into guests (event_id, name, position, is_paid) values((select event_id from primary_event),?,?,0)',
                                      (guest_name, position))

    def removeGuest(self, guest_id):
        with self.__connection:
            self.__cursor.execute('delete from guests where id=?', (guest_id,))
            self.__connection.commit()
            return self.__cursor.rowcount == 1

    def updateGuest(self, id, position, is_paid):
        with self.__connection:
            self.__cursor.execute('update guests set position=?, is_paid=? where id=?', (position, is_paid, id))
            self.__connection.commit()
            return self.__cursor.rowcount == 1

    def getEvent(self, event_id):
        query_guests = 'select guests.id, guests.name, guests.position, guests.is_paid from guests inner join events on events.id = guests.event_id'
        query_event = 'select events.id, date, location, payment_link from events';

        params = ()
        if event_id is None:
            query_guests += '  inner join primary_event on primary_event.event_id = events.id';
            query_event += ' inner join primary_event on primary_event.event_id = events.id';
        else:
            query_guests += ' where events.id=?'
            query_event += ' where events.id=?'
            params = (event_id,)

        self.__cursor.execute(query_event, params)
        row = self.__cursor.fetchone()

        if not row:
            return None

        event = {'id': row[0],
                 'date': row[1],
                 'location': row[2],
                 'payment_link': row[3],
                 'guests': []}

        guests = []
        for row in self.__cursor.execute(query_guests + ' order by guests.id limit 100', params):
            event['guests'].append({'guest_id':row[0],
                                    'guest_name':row[1],
                                    'guest_position':row[2],
                                    'guest_paid':row[3]})
        return event

class VolleyAPI:
    def __init__(self):
        self.__handlers = {
            'add_event': self.add_event,
            'events': self.events,
            'update_event': self.update_event,
            'set_primary_event': self.set_primary_event,
            'update_guest': self.update_guest,
            'add_guest': self.add_guest,
            'remove_guest': self.remove_guest,
            'event': self.event
        }
        if is_debug():
            self.__handlers['init'] = self.init

    def dispatch(self, form):
        try:
            if 'action' not in form:
                return self.__error('Configuration error, action is missing')
            action = form.getfirst('action')
            if action not in self.__handlers:
                return self.__error('Configuration error, unknown action.')

            return self.__handlers[action](form)

        except sqlite3.IntegrityError as e:
            logger.error(e, exc_info=True)
            return self.__error('Integrity error')
        except sqlite3.OperationalError as e:
            logger.error(e, exc_info=True)
            return self.__error('Operational error')
        except Exception as e:
            logger.error(e, exc_info=True)
            return self.__error('Hmmm... unknown error')

    def init(self, form):
        with VolleyDB() as db:
            db.createTables()
            return self.__success('Tables have been created')

    def add_event(self, form):
       if 'date' not in form or 'location' not in form or 'payment_link' not in form:
           return self.__error('Could not add an event, fields are missing')
       with VolleyDB() as db:
           db.addEvent(form.getfirst('date'), form.getfirst('location'), form.getfirst('payment_link'))
           return self.__success('Event has been added')

    def events(self, form):
       with VolleyDB() as db:
           events = db.getEvents()
           return self.__success(events)

    def update_event(self, form):
       if 'id' not in form or 'date' not in form or 'location' not in form or 'payment_link' not in form:
           return self.__error('Could not update an event, fields are missing')
       with VolleyDB() as db:
           if db.updateEvent(form.getfirst('id'), form.getfirst('date'), form.getfirst('location'), form.getfirst('payment_link')):
               return self.__success('Event has been updated')
           else:
               return self.__error('Could not find an event to update')

    def set_primary_event(self, form):
       if 'id' not in form:
           return self.__error('Could not update primary event, fields are missing.')
       with VolleyDB() as db:
           try:
               db.setPrimaryEvent(form.getfirst('id'))
               return self.__success('Primary event has been updated.')
           except sqlite3.IntegrityError as e:
               return self.__error('Could not set such an event as primary.')

    def update_guest(self, form):
       if 'id' not in form or 'position' not in form or 'is_paid' not in form:
           return self.__error('Could not update a guest, fields are missing')
       with VolleyDB() as db:
           if db.updateGuest(form.getfirst('id'), form.getfirst('position'), form.getfirst('is_paid') == '1'):
               return self.__success('Guest has been updated')
           else:
               return self.__error('Could not find a guest')

    def add_guest(self, form):
       if 'name' not in form or 'position' not in form:
           return self.__error('Could not add a guest, fields are missing')
       event_id = form.getfirst('event_id') if 'event_id' in form else None
       with VolleyDB() as db:
           try:
               db.addGuest(event_id, form.getfirst('name'), form.getfirst('position'))
               return self.__success('Guest has been added')
           except sqlite3.IntegrityError as e:
               return self.__error('Could not add guest for such event')

    def remove_guest(self, form):
        if 'id' not in form:
            return self.__error('Could not remove a guest, fields are missing')
        with VolleyDB() as db:
            try:
                db.removeGuest(form.getfirst('id'))
                return self.__success('Guest has been removed')
            except sqlite3.IntegrityError as e:
                return self.__error('Could not remove guest')

    def event(self, form):
       event_id = form.getfirst('id') if 'id' in form else None
       with VolleyDB() as db:
           event = db.getEvent(event_id)
           if not event:
               return self.__error('Event not found')
           else:
               return self.__success(event)

    def __error(self, msg):
        logger.error('Error reply: {}'.format(msg))
        return cgi.escape(json.dumps({'status': 1, 'message': msg}, sort_keys=True), False)

    def __success(self, msg):
        return cgi.escape(json.dumps({'status': 0, 'message': msg}, sort_keys=True), False)

api = VolleyAPI()
form = cgi.FieldStorage()
result = api.dispatch(form)

if not is_debug():
    print('Content-Type: text/plain\n')
print(result)

#!/usr/bin/env python3

import sqlite3
import sys
import os
import json
import cgi

class VolleyDB:
    def __init__(self, dbfile):
        self.__connection = sqlite3.connect(dbfile)
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
        for row in self.__cursor.execute('select id,date,location,payment_link from events order by id desc'):
            events.append({'id':row[0], 'date':row[1], 'location':row[2], 'payment_link':row[3]})
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

    def addGuest(self, event_id, guest_name, position):
        with self.__connection:
            self.__cursor.execute('insert into guests (event_id, name, position, is_paid) values(?,?,?,?)', (event_id, guest_name, position, 0))

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
        guests = []
        for row in self.__cursor.execute('select events.date, events.location, guests.id, guests.name, guests.position, guests.is_paid from guests inner join events on events.id = guests.event_id where events.id=? order by guests.id', (event_id,)):
            guests.append({'date':row[0], 'location':row[1], 'guest_id':row[2], 'guest_name':row[3], 'guest_position':row[4], 'guest_paid':row[5]})
        return guests

def is_debug():
    return os.getenv("VOLLEY_DEBUG") is not None

def return_error(msg):
    return cgi.escape(json.dumps({'status': 1, 'message': msg}, sort_keys=True), False)

def return_success(msg):
    return cgi.escape(json.dumps({'status': 0, 'message': msg}, sort_keys=True), False)

def action(form):
    try:
        if 'action' not in form:
            return return_error('Configuration error, action is missing')

        action = form.getfirst('action')
        db_name=os.getenv('VOLLEY_DB', 'vb.sqlite')

        if action == 'init' and is_debug():
            with VolleyDB(db_name) as db:
                db.createTables()
                return return_success('Tables have been created')
        elif action == 'add_event':
            if 'date' not in form or 'location' not in form or 'payment_link' not in form:
                return return_error('Could not add an event, fields are missing')
            with VolleyDB(db_name) as db:
                db.addEvent(form.getfirst('date'), form.getfirst('location'), form.getfirst('payment_link'))
                return return_success('Event has been added')
        elif action == 'events':
            with VolleyDB(db_name) as db:
                events = db.getEvents()
                return return_success(events)
        elif action == 'update_event':
            if 'id' not in form or 'date' not in form or 'location' not in form or 'payment_link' not in form:
                return return_error('Could not update an event, fields are missing')
            with VolleyDB(db_name) as db:
                if db.updateEvent(form.getfirst('id'), form.getfirst('date'), form.getfirst('location'), form.getfirst('payment_link')):
                    return return_success('Event has been updated')
                else:
                    return return_error('Could not find an event to update')
        elif action == 'update_guest':
            if 'id' not in form or 'position' not in form or 'is_paid' not in form:
                return return_error('Could not update a guest, fields are missing')
            with VolleyDB(db_name) as db:
                if db.updateGuest(form.getfirst('id'), form.getfirst('position'), form.getfirst('is_paid') == '1'):
                    return return_success('Guest has been updated')
                else:
                    return return_error('Could not find a guest')
        elif action == 'add_guest':
            if 'event_id' not in form or 'name' not in form or 'position' not in form:
                return return_error('Could not add a guest, fields are missing')
            with VolleyDB(db_name) as db:
                try:
                    db.addGuest(form.getfirst('event_id'), form.getfirst('name'), form.getfirst('position'))
                    return return_success('Guest has been added')
                except sqlite3.IntegrityError as e:
                    return return_error('Could not add guest for such event')
        elif action == 'remove_guest':
            if 'id' not in form:
                return return_error('Could not remove a guest, fields are missing')
            with VolleyDB(db_name) as db:
                try:
                    db.removeGuest(form.getfirst('id'))
                    return return_success('Guest has been removed')
                except sqlite3.IntegrityError as e:
                    return return_error('Could not remove guest')
        elif action == 'event':
            if 'id' not in form:
                return return_error('Could not get event, id is not provided')
            with VolleyDB(db_name) as db:
                event = db.getEvent(form.getfirst('id'))
                return return_success(event)
        else:
            return return_error('Configuration error, unknown action.')
    except sqlite3.IntegrityError as e:
        print(str(e), file=sys.stderr)
        return return_error('Integrity error')
    except sqlite3.OperationalError as e:
        print(str(e), file=sys.stderr)
        return return_error('Operational error')
    except:
        print('Unknown error', file=sys.stderr)
        return return_error('Hmmm... unknown error')

form = cgi.FieldStorage()
result = action(form)

if not is_debug():
    print('Content-Type: text/plain\n')
print(result)

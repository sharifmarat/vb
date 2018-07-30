from unittest import TestCase
import logging
import os
import json
from subprocess import run, PIPE
from tempfile import mkstemp
from urllib.parse import urlencode

log = logging.getLogger(__name__)


class CgiMixin:

    CGI_COMMAND = [
        os.path.join(os.path.dirname(__file__), '..', 'cgi-bin', 'vb.cgi')]

    def setUp(self):
        _, self._db_file = mkstemp()
        log.info("Database file: %s", self._db_file)
        log.info("Using init endpoint to create the database")
        self.request_json({'action': 'init'})

    def tearDown(self):
        logging.info("removing database file")
        os.unlink(self._db_file)

    def request_json(self, form=None, environ=None):
        if environ is None:
            environ = {}
        assert 'QUERY_STRING' not in environ, \
            "Both QUERY_STRING and form cannot be provided"
        if form is not None:
            query_string = urlencode(form, doseq=True)
            environ['QUERY_STRING'] = query_string
        env = os.environ.copy()
        env.update(environ)
        env.update({
            'VOLLEY_DEBUG': '1',
            'VOLLEY_DB': self._db_file,
        })
        log.debug("Running cgi with QUERY_STRING=%s",
                  environ.get('QUERY_STRING', '(key not present)'))
        output = run(self.CGI_COMMAND, env=env, check=True, stdout=PIPE).stdout
        log.debug("Request response:%s", output)
        return json.loads(output)


class ApiTestMixin:

    def check_request(self, form, expected_response):
        response = self.request_json(form)
        self.assertEqual(response, expected_response)

    def assert_request_succeeds(self, form, message):
        self.check_request(form, {"message": message, "status": 0})

    def assert_request_fails(self, form, message):
        self.check_request(form, {"message": message, "status": 1})

    def assert_is_primary_event(self, event_id):
        response = self.request_json({'action': 'events'})
        assert response['status'] == 0, "Request failed"
        for event in response['message']:
            if event['id'] == event_id:
                assert event['primary'] == 1, \
                    "Expected event #{} to be marked as primary".format(
                        event_id)
                return
        raise Exception("Event #{} not found".format(event_id))

    def assert_is_not_primary_event(self, event_id):
        response = self.request_json({'action': 'events'})
        assert response['status'] == 0, "Request failed"
        for event in response['message']:
            if event['id'] == event_id:
                assert event['primary'] == 0, \
                    "Expected event #{} NOT to be marked as primary".format(
                        event_id)
                return
        raise Exception("Event #{} not found".format(event_id))

    def assert_guest_present(self, event_id, name, position, paid=0):
        response = self.request_json({'action': 'event', 'id': event_id})
        assert response['status'] == 0, "Request failed"
        expected = {
            'guest_name': name,
            'guest_paid': paid,
            'guest_position': position,
        }
        for guest in response['message']['guests']:
            del guest['guest_id']
            if guest == expected:
                return
        raise AssertionError("Expected guest was not found")

    def assert_guest_not_present(self, event_id, name, position, paid=0):
        response = self.request_json({'action': 'event', 'id': event_id})
        assert response['status'] == 0, "Request failed"
        expected = {
            'guest_name': name,
            'guest_paid': paid,
            'guest_position': position,
        }
        for guest in response['message']['guests']:
            del guest['guest_id']
            if guest == expected:
                raise AssertionError("Unexpected guest found")

    def assert_shame_present(self, name):
        response = self.request_json({'action': 'shame'})
        assert response['status'] == 0, "Request failed"
        expected = {
            'name': name,
        }
        self.assertIn(expected, response['message'])

    def assert_shame_not_present(self, name):
        response = self.request_json({'action': 'shame'})
        assert response['status'] == 0, "Request failed"
        expected = {
            'name': name,
        }
        self.assertNotIn(expected, response['message'])

    def add_event(self, date, location, payment_link):
        form = {
            'action': 'add_event',
            'date': date,
            'location': location,
            'payment_link': payment_link,
        }
        self.request_json(form)
        response = self.request_json({'action': 'events'})
        # TODO make api return event id instead
        event_list = response['message']
        # Return the event with the highest id
        return sorted(event_list, key=lambda d: d['id'])[-1]

    def set_primary_event(self, event_id):
        form = {
            'action': 'set_primary_event',
            'id': event_id,
        }
        response = self.request_json(form)
        return response['status'] == 0

    def add_guest(self, event_id, name, position):
        form = {
            'action': 'add_guest',
            'name': name,
            'position': position,
            'event_id': event_id,
        }
        self.request_json(form)
        response = self.request_json({'action': 'event', 'id': event_id})
        # TODO make api return event id instead
        guest_list = response['message']['guests']
        # Return the guest with the highest id
        return sorted(guest_list, key=lambda d: d['guest_id'])[-1]


class ApiTestCase(ApiTestMixin, CgiMixin, TestCase):
    pass


class TestAction(ApiTestCase):

    def test_invalid_action(self):
        self.assert_request_fails(
            {'action': 'unknown'}, "Configuration error, unknown action.")

    def test_action_missing(self):
        self.assert_request_fails({}, "Configuration error, action is missing")


class TestEvents(ApiTestCase):

    def test_empty_db(self):
        self.assert_request_succeeds({'action': 'events'}, [])


class TestAddEvent(ApiTestCase):

    def test_empty_event_params(self):
        form = {
            'action': 'add_event',
        }
        self.assert_request_fails(
            form, "Could not add an event, fields are missing")
        self.assert_request_succeeds({'action': 'events'}, [])

    def test_missing_event_date(self):
        form = {
            'action': 'add_event',
            'location': 'foo',
            'payment_link': 'bar',
        }
        self.assert_request_fails(
            form, "Could not add an event, fields are missing")
        self.assert_request_succeeds({'action': 'events'}, [])

    def test_missing_event_location(self):
        form = {
            'action': 'add_event',
            'date': 'foo',
            'payment_link': 'bar',
        }
        self.assert_request_fails(
            form, "Could not add an event, fields are missing")
        self.assert_request_succeeds({'action': 'events'}, [])

    def test_missing_event_payment_link(self):
        form = {
            'action': 'add_event',
            'location': 'foo',
            'date': 'bar',
        }
        self.assert_request_fails(
            form, "Could not add an event, fields are missing")
        self.assert_request_succeeds({'action': 'events'}, [])

    def test_add_one_event(self):
        form = {
            'action': 'add_event',
            'date': '25-07-2018',
            'location': 'de Pijp',
            'payment_link': 'TBD',
        }
        expected = [{
            "id": 1,
            "date": form['date'],
            "location": form['location'],
            "payment_link": form['payment_link'],
            "primary": False
        }]
        self.assert_request_succeeds(form, "Event has been added")
        self.assert_request_succeeds({'action': 'events'}, expected)

    def test_add_three_events(self):
        form_1 = {
            'action': 'add_event',
            'date': 'date1',
            'location': 'loc1',
            'payment_link': 'link1',
        }
        form_2 = {
            'action': 'add_event',
            'date': 'date2',
            'location': 'loc2',
            'payment_link': 'link2',
        }
        form_3 = {
            'action': 'add_event',
            'date': 'date3',
            'location': 'loc3',
            'payment_link': 'link3',
        }
        expected_1 = {
            "id": 1,
            "date": form_1['date'],
            "location": form_1['location'],
            "payment_link": form_1['payment_link'],
            "primary": False
        }
        expected_2 = {
            "id": 2,
            "date": form_2['date'],
            "location": form_2['location'],
            "payment_link": form_2['payment_link'],
            "primary": False
        }
        expected_3 = {
            "id": 3,
            "date": form_3['date'],
            "location": form_3['location'],
            "payment_link": form_3['payment_link'],
            "primary": False
        }

        self.assert_request_succeeds(form_1, "Event has been added")
        self.assert_request_succeeds(form_2, "Event has been added")
        self.assert_request_succeeds(form_3, "Event has been added")
        response = self.request_json({'action': 'events'})
        self.assertEqual(response['status'], 0)
        self.assertEqual(len(response['message']), 3,
                         msg="Expected 3 items in the response")
        self.assertIn(expected_1, response['message'])
        self.assertIn(expected_2, response['message'])
        self.assertIn(expected_3, response['message'])


class TestUpdateEvent(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event = self.add_event('25-07-2018', 'de Pijp', 'TBD')

    def test_empty_event_params(self):
        form = {
            'action': 'update_event',
        }
        self.assert_request_fails(
            form, "Could not update an event, fields are missing")

    def test_missing_event_id(self):
        form = {
            'action': 'update_event',
            'date': 'foo',
            'location': 'bar',
            'payment_link': 'baz',
        }
        self.assert_request_fails(
            form, "Could not update an event, fields are missing")

    def test_missing_event_date(self):
        form = {
            'action': 'update_event',
            'id': self.event['id'],
            'location': 'foo',
            'payment_link': 'bar',
        }
        self.assert_request_fails(
            form, "Could not update an event, fields are missing")

    def test_missing_event_location(self):
        form = {
            'action': 'update_event',
            'id': self.event['id'],
            'date': 'foo',
            'payment_link': 'bar',
        }
        self.assert_request_fails(
            form, "Could not update an event, fields are missing")

    def test_missing_event_payment_link(self):
        form = {
            'action': 'update_event',
            'id': self.event['id'],
            'location': 'foo',
            'date': 'bar',
        }
        self.assert_request_fails(
            form, "Could not update an event, fields are missing")

    def test_non_existing_event_id(self):
        event_id = 87262
        assert event_id != self.event['id'], "This should never happen"
        form = {
            'action': 'update_event',
            'id': event_id,
            'date': 'foo',
            'location': 'bar',
            'payment_link': 'baz',
        }
        self.assert_request_fails(form, "Could not find an event to update")

    def test_update_successful(self):
        form = {
            'action': 'update_event',
            'id': self.event['id'],
            'date': '24-07-2018',
            'location': 'Marnix',
            'payment_link': 'TBD2',
        }
        # Just making sure we update with a different set of data
        assert form['date'] != self.event['date']
        assert form['location'] != self.event['location']
        assert form['payment_link'] != self.event['payment_link']
        expected = [{
            "id": self.event['id'],
            "date": form['date'],
            "location": form['location'],
            "payment_link": form['payment_link'],
            "primary": False
        }]
        self.assert_request_succeeds(form, "Event has been updated")

        self.assert_request_succeeds({'action': 'events'}, expected)


class TestAddGuest(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event = self.add_event('25-07-2018', 'de Pijp', 'TBD')

    def test_no_params(self):
        self.assert_request_fails({'action': 'add_guest'},
                                  "Could not add a guest, fields are missing")

    def test_missing_name(self):
        form = {
            'action': 'add_guest',
            'position': 'foo',
            'event_id': self.event['id'],
        }
        self.assert_request_fails(
            form, "Could not add a guest, fields are missing")

    def test_missing_position(self):
        form = {
            'action': 'add_guest',
            'name': 'foo',
            'event_id': self.event['id'],
        }
        self.assert_request_fails(
            form, "Could not add a guest, fields are missing")

    def test_missing_event_id(self):
        form = {
            'action': 'add_guest',
            'name': 'foo',
            'position': 'bar',
        }
        self.assert_request_fails(
            form, "Could not add guest for such event")

    def test_nonexisting_event_id(self):
        event_id = 87262
        assert event_id != self.event['id'], "This should never happen"
        form = {
            'action': 'add_guest',
            'name': 'foo',
            'position': 'bar',
            'event_id': event_id,
        }
        self.assert_request_fails(
            form, "Could not add guest for such event")
        self.assert_guest_not_present(self.event['id'], name=form['name'],
                                      position=form['position'])

    def test_add_one_guest(self):
        form = {
            'action': 'add_guest',
            'name': 'foo',
            'position': 'bar',
            'event_id': self.event['id'],
        }
        self.assert_request_succeeds(form, "Guest has been added")
        self.assert_guest_present(self.event['id'], name=form['name'],
                                  position=form['position'])

    def test_add_three_guests(self):
        form_1 = {
            'action': 'add_guest',
            'name': 'name1',
            'position': 'position1',
            'event_id': self.event['id'],
        }
        form_2 = {
            'action': 'add_guest',
            'name': 'name2',
            'position': 'position2',
            'event_id': self.event['id'],
        }
        form_3 = {
            'action': 'add_guest',
            'name': 'name3',
            'position': 'position3',
            'event_id': self.event['id'],
        }
        self.assert_request_succeeds(form_1, "Guest has been added")
        self.assert_request_succeeds(form_2, "Guest has been added")
        self.assert_request_succeeds(form_3, "Guest has been added")
        self.assert_guest_present(self.event['id'], name=form_1['name'],
                                  position=form_1['position'])
        self.assert_guest_present(self.event['id'], name=form_2['name'],
                                  position=form_2['position'])
        self.assert_guest_present(self.event['id'], name=form_3['name'],
                                  position=form_3['position'])


class TestEvent(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event_1 = self.add_event('date_1', 'loc_1', 'TBD_1')
        self.event_2 = self.add_event('date_2', 'loc_2', 'TBD_2')
        self.event_3 = self.add_event('date_3', 'loc_3', 'TBD_3')
        self.guest_1 = self.add_guest(self.event_2['id'], 'name_1', 'pos_1')
        self.guest_2 = self.add_guest(self.event_3['id'], 'name_2', 'pos_2')
        self.guest_3 = self.add_guest(self.event_3['id'], 'name_3', 'pos_3')
        self.guest_4 = self.add_guest(self.event_3['id'], 'name_4', 'pos_4')

    def test_no_params(self):
        self.assert_request_fails({'action': 'event'}, 'Event not found')

    def test_nonexisting_event_id(self):
        event_id = 475686
        assert event_id != self.event_1['id'], "This should never happen"
        assert event_id != self.event_2['id'], "This should never happen"
        assert event_id != self.event_3['id'], "This should never happen"
        self.assert_request_fails(
            {'action': 'event', 'id': event_id}, 'Event not found')

    def test_event_with_no_guests(self):
        form = {
            'action': 'event',
            'id': self.event_1['id'],
        }
        expected = {
            'id': self.event_1['id'],
            'date': self.event_1['date'],
            'location': self.event_1['location'],
            'payment_link': self.event_1['payment_link'],
            'guests': [],
        }
        self.assert_request_succeeds(form, expected)

    def test_event_with_one_guest(self):
        form = {
            'action': 'event',
            'id': self.event_2['id'],
        }
        expected = {
            'id': self.event_2['id'],
            'date': self.event_2['date'],
            'location': self.event_2['location'],
            'payment_link': self.event_2['payment_link'],
            'guests': [{
                'guest_id': self.guest_1['guest_id'],
                'guest_name': self.guest_1['guest_name'],
                'guest_paid': 0,
                'guest_position': self.guest_1['guest_position'],
            }],
        }
        self.assert_request_succeeds(form, expected)

    def test_event_with_three_guest(self):
        form = {
            'action': 'event',
            'id': self.event_3['id'],
        }
        expected = {
            'id': self.event_3['id'],
            'date': self.event_3['date'],
            'location': self.event_3['location'],
            'payment_link': self.event_3['payment_link'],
            'guests': [
                {
                    'guest_id': self.guest_2['guest_id'],
                    'guest_name': self.guest_2['guest_name'],
                    'guest_paid': 0,
                    'guest_position': self.guest_2['guest_position'],
                },
                {
                    'guest_id': self.guest_3['guest_id'],
                    'guest_name': self.guest_3['guest_name'],
                    'guest_paid': 0,
                    'guest_position': self.guest_3['guest_position'],
                },
                {
                    'guest_id': self.guest_4['guest_id'],
                    'guest_name': self.guest_4['guest_name'],
                    'guest_paid': 0,
                    'guest_position': self.guest_4['guest_position'],
                },
            ],
        }
        self.assert_request_succeeds(form, expected)


class TestRemoveGuest(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event_1 = self.add_event('date_1', 'loc_1', 'TBD_1')
        self.guest_1 = self.add_guest(self.event_1['id'], 'name_1', 'pos_1')

        self.event_2 = self.add_event('date_2', 'loc_2', 'TBD_2')
        self.guest_2 = self.add_guest(self.event_2['id'], 'name_2', 'pos_2')
        self.guest_3 = self.add_guest(self.event_2['id'], 'name_3', 'pos_3')

    def test_no_params(self):
        self.assert_request_fails(
            {'action': 'remove_guest'},
            "Could not remove a guest, fields are missing")

    def test_nonexisting_guest(self):
        # TODO should raise an error
        self.assert_request_succeeds({'action': 'remove_guest', 'id': 4234},
                                     "Guest has been removed")

    def test_remove_last_guest(self):
        self.assert_request_succeeds(
            {'action': 'remove_guest', 'id': self.guest_1['guest_id']},
            "Guest has been removed")
        self.assert_guest_not_present(
            self.event_1['id'], name=self.guest_1['guest_name'],
            position=self.guest_1['guest_position'])

    def test_remove_guest(self):
        self.assert_request_succeeds(
            {'action': 'remove_guest', 'id': self.guest_2['guest_id']},
            "Guest has been removed")

        self.assert_guest_not_present(
            self.event_2['id'], name=self.guest_2['guest_name'],
            position=self.guest_2['guest_position'])

        self.assert_guest_present(
            self.event_2['id'], name=self.guest_3['guest_name'],
            position=self.guest_3['guest_position'])


class TestEditPrimaryEvent(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event_1 = self.add_event(
            date="date_1", location="loc_1", payment_link="tbd_1")
        self.event_2 = self.add_event(
            date="date_2", location="loc_2", payment_link="tbd_2")

    def test_missing_event_id(self):
        self.assert_request_fails(
            {'action': 'set_primary_event'},
            "Could not update primary event, fields are missing."
        )
        self.assert_is_not_primary_event(self.event_1['id'])
        self.assert_is_not_primary_event(self.event_2['id'])

    def test_nonint_event_id(self):
        event_id = "foo"
        form = {
            'action': 'set_primary_event',
            'id': event_id,
        }
        self.assert_request_fails(
            form, "Could not set such an event as primary.")
        self.assert_is_not_primary_event(self.event_1['id'])
        self.assert_is_not_primary_event(self.event_2['id'])

    def test_nonexisting_event_id(self):
        event_id = 87262
        assert event_id != self.event_1['id'], "This should never happen"
        assert event_id != self.event_2['id'], "This should never happen"
        form = {
            'action': 'set_primary_event',
            'id': event_id,
        }
        self.assert_request_fails(
            form, "Could not set such an event as primary.")
        self.assert_is_not_primary_event(self.event_1['id'])
        self.assert_is_not_primary_event(self.event_2['id'])

    def test_set(self):
        form = {
            'action': 'set_primary_event',
            'id': self.event_1['id'],
        }
        self.assert_request_succeeds(
            form, "Primary event has been updated.")

        self.assert_is_primary_event(self.event_1['id'])
        self.assert_is_not_primary_event(self.event_2['id'])

    def test_update(self):
        self.set_primary_event(self.event_1['id'])
        self.set_primary_event(self.event_2['id'])

        self.assert_is_not_primary_event(self.event_1['id'])
        self.assert_is_primary_event(self.event_2['id'])


class TestPrimaryEventBehaviour(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event_1 = self.add_event(
            date="date_1", location="loc_1", payment_link="tbd_1")
        self.event_primary = self.add_event(
            date="date_2", location="loc_2", payment_link="tbd_2")
        self.set_primary_event(self.event_primary['id'])

    def test_event_with_missing_id(self):
        form = {
            'action': 'event',
        }
        expected = {
            'id': self.event_primary['id'],
            'date': self.event_primary['date'],
            'location': self.event_primary['location'],
            'payment_link': self.event_primary['payment_link'],
            'guests': [],
        }
        self.assert_request_succeeds(form, expected)

    def test_event_with_empty_id(self):
        form = {
            'action': 'event',
            'id': '',
        }
        expected = {
            'id': self.event_primary['id'],
            'date': self.event_primary['date'],
            'location': self.event_primary['location'],
            'payment_link': self.event_primary['payment_link'],
            'guests': [],
        }
        self.assert_request_succeeds(form, expected)

    def test_add_one_guest(self):
        form = {
            'action': 'add_guest',
            'name': 'foo',
            'position': 'bar',
        }
        self.assert_request_succeeds(form, "Guest has been added")
        self.assert_guest_present(self.event_primary['id'], name=form['name'],
                                  position=form['position'])


class TestShame(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.event = self.add_event('date_1', 'loc_1', 'TBD_1')
        self.guest_1 = self.add_guest(self.event['id'], 'name_1', 'pos_1')
        self.guest_2 = self.add_guest(self.event['id'], 'name_2', 'pos_2')
        self.guest_3 = self.add_guest(self.event['id'], 'name_3', 'pos_3')

    def test_no_shame(self):
        self.assert_request_succeeds(
            {'action': 'shame'}, [])

    def test_one_shame(self):
        self.request_json(
            {'action': 'remove_guest', 'id': self.guest_1['guest_id']})

        self.assert_shame_present(name=self.guest_1['guest_name'])
        self.assert_shame_not_present(name=self.guest_2['guest_name'])

    def test_two_shames(self):
        self.request_json(
            {'action': 'remove_guest', 'id': self.guest_1['guest_id']})
        self.request_json(
            {'action': 'remove_guest', 'id': self.guest_3['guest_id']})

        self.assert_shame_present(name=self.guest_1['guest_name'])
        self.assert_shame_not_present(name=self.guest_2['guest_name'])
        self.assert_shame_present(name=self.guest_3['guest_name'])

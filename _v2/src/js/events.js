$(document).ready(() => {
  const navbar = new Vue({ el: '#navbar' });

  const eventsList = new Vue({
    el: '#events-list',
    data: {
      events: [],
      new_event: {},
    },
    methods: {
      set_primary_event: function (event) {
        action_reload({
          action: 'set_primary_event',
          id: event.id
        });
      },
      update_event: function (event) {
        if (confirm('Are you sure you want to event ' + event.date + ' in ' + event.location)) {
          action_reload({
            action: 'update_event',
            id: event.id,
            date: event.date,
            location: event.location,
            payment_link: event.payment_link,
          });
        }
      },
      create_event: function () {
        action_reload({
          action: 'add_event',
          date: this.new_event.date,
          location: this.new_event.location,
          payment_link: this.new_event.payment_link,
        });
      }
    },
    template: `
      <div class="table-container">
        <table class="table is-hoverable is-striped is-fullwidth">
          <thead>
            <tr>
              <th>Date</th>
              <th>Location</th>
              <th>Payment</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(event, index) in events">
              <td>
                {{ parse_date(event.date).toLocaleString(luxon.DateTime.DATETIME_SHORT) }}
              </td>
              <td>{{ event.location }}</td>
              <td>
                <input class="input column" type="text" v-model="event.payment_link" />
              </td>
              <td class="table-container__actions-cell">
                <button class="button is-small is-outlined is-success" @click="update_event(event)">
                  <i class="fas fa-check is-hidden-tablet"></i>
                  <span class="is-hidden-mobile">
                    <span class="icon is-small">
                      <i class="fas fa-check"></i>
                    </span>
                    <span>Update</span>
                  </span>
                </button>
                <button v-if="!event.primary" class="button is-small is-outlined is-info" @click="set_primary_event(event)">
                  <i class="far fa-star is-hidden-tablet"></i>
                  <span class="is-hidden-mobile">
                    <span class="icon is-small">
                      <i class="far fa-star"></i>
                    </span>
                    <span>Set as primary</span>
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="theme-primary">
                <datetime
                  type="datetime"
                  input-class="input column theme-primary"
                  v-model="new_event.date"
                  minute-step="30"
                  min-datetime= "2018-07-12T19:00:00"
                  placeholder="Date"
                  auto
                >
                </datetime>
              </td>
              <td>
                <input class="input" type="text" placeholder="Location" v-model="new_event.location" />
              </td>
              <td>
                <input class="input" type="text" placeholder="Payment link" v-model="new_event.payment_link"/>
              </td>
              <td class="table-container__actions-cell">
                <button class="button is-small is-outlined is-success" @click="create_event()">
                  <i class="fas fa-plus is-hidden-tablet"></i>
                  <span class="is-hidden-mobile">
                    <span class="icon is-small">
                      <i class="fas fa-plus"></i>
                    </span>
                    <span>Create event</span>
                  </span>
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>`,
  });

  $(document).ready(function() {
    $.ajax({type: "POST",
      url: apiLink,
      data: {
        action: 'events'
      },
      success: function(response){
        var result = JSON.parse(response);
        if (result.status != 0) {
          alert('error: ' + result.message);
        } else {
          eventsList.events = result.message;
        }
      },
      error: function(response){
        alert('server error');
      }
    });
  });
});

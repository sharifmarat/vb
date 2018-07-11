$(document).ready(() => {
  const get_query_value = key => {
    var query = window.location.search.substring(1);
    var pairs = query.split("&");
    for (var i = 0; i < pairs.length; i++) {
      var key_value = pairs[i].split("=");
      if (key_value[0] == key) {
        return key_value[1];
      }
    }

    return "";
  }

  const navbar = new Vue({ el: '#navbar' });

  const currentEventInfo = new Vue({
    el: '#current-event-info',
    data: {
      date: 'Loading...',
      start: undefined,
      end: undefined,
      timezone: 'Europe/Amsterdam',
      location: undefined,
      payment_link: undefined,
    },
    updated: () => addeventatc.refresh(),
    template: `
      <div class="column">
        <strong>
          <label>{{ start }}</label>
          <label>{{ location }}</label>
        </strong>
        &nbsp;
        <span v-if="start">
          <span title="Add to Calendar" class="addeventatc">
            Add to Calendar
            <span class="start">{{ start }}</span>
            <span class="end">{{ end }}</span>
            <span class="timezone">{{ timezone }}</span>
            <span class="title">Let's volleyball @{{ location }} on {{ start }}</span>
            <span class="description">Let's volleyball @{{ location }} on {{ start }}</span>
            <span class="location">{{ location }}</span>
          </span>
          <br />
        </span>
        Pay here: <a :href="payment_link" target="_blank">{{ payment_link ? 'link' : 'Loading ... '}}</a>
      </div>`,
  });

  const playersList = new Vue({
    el: '#players-list',
    data: {
      players: [],
      new_player: {},
      edit_player: {},
    },
    methods: {
      getChildModalByName: function (name) {
        if (_.isEmpty(this.v_children)) {
          this.v_children = _.keyBy(this.$children, function (child) { return child.$props.name; });
        }

        return this.v_children[name];
      },
      open_modal: function (player) {
        if (player) {
          this.edit_player = player;
          const child = this.getChildModalByName('edit-player');
          child.open();
        } else {
          const child = this.getChildModalByName('new-player');
          child.open();
        }
      },
      close_modal: function () {
        this.edit_player = {};
        this.new_player = {};
        this.getChildModalByName('edit-player').close();
        this.getChildModalByName('new-player').close();
      },
      add_guest: function () {
        action_reload({
          action: 'add_guest',
          event_id: get_query_value('event_id'),
          name: `${this.new_player.first_name} ${this.new_player.last_name}`,
          position: this.new_player.position,
        });

        this.new_player = {};
      },
      update_paid: function (player) {
          if (confirm('Are you sure you want to update ' + name)) {
            $.ajax({type: "POST",
              url: apiLink,
              data: {
                action: 'update_guest',
                id: player.guest_id,
                is_paid: player.guest_paid ? 1 : 0,
              },
              success: function(response){
                var result = JSON.parse(response);
                if (result.status != 0) {
                  alert('error: ' + result.message);
                  player.guest_paid = !player.guest_paid;
                }
              },
              error: function(response){
                alert('server error');
                player.guest_paid = !player.guest_paid;
              }
            });
          } else {
            player.guest_paid = !player.guest_paid;
          }
      },
      update_guest: function () {
        if (confirm('Are you sure you want to update ' + this.edit_player.guest_name)) {

          action_reload({
            action: 'update_guest',
            id: this.edit_player.guest_id,
            position: this.edit_player.guest_position,
            is_paid: this.edit_player.guest_paid
          });

          this.edit_player = {};
        }
      },
      remove_guest: function () {
        var p = prompt('Type yes to remove ' + this.edit_player.guest_name + '. This is permanent!');
        if (p == null) {
          return;
        }
        if (p.toUpperCase() != 'YES') {
          alert('Remove failed. You had to type yes to remove.');
          return;
        }
        action_reload({
          action: 'remove_guest',
          id: this.edit_player.guest_id
        });
        this.edit_player = {};
      }
    },
    template: `
      <div class="table-container column">
        <table class="table is-hoverable is-striped is-fullwidth">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Position</th>
              <th>Paid</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(player, index) in players">
              <td>{{ index + 1 }}</td>
              <td>{{ player.guest_name }}</td>
              <td>{{ player.guest_position }}</td>
              <td>
                <label class="checkbox column">
                  <input class="" type="checkbox" v-model="player.guest_paid" @change="update_paid(player)"/>
                </label>
              </td>
              <td class="table-container__actions-cell">
                <button class="button is-small is-outlined is-success" @click="open_modal(player)">
                  <i class="fas fa-edit is-hidden-tablet"></i>
                  <span class="is-hidden-mobile">
                    <span class="icon is-small">
                      <i class="fas fa-edit"></i>
                    </span>
                    <span>Edit</span>
                  </span>
                </button>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>New</th>
              <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
              <td class="table-container__actions-cell is-four-fifths">
                <button class="button is-small is-outlined is-success" @click="open_modal()">
                  <i class="fas fa-plus is-hidden-tablet"></i>
                  <span class="is-hidden-mobile">
                    <span class="icon is-small">
                      <i class="fas fa-plus"></i>
                    </span>
                    <span>Add new player</span>
                  </span>
                </button>
              </td>
            </tr>
          </tfoot>
        </table>

        <modal title="Edit player" name='edit-player'>
          <template slot="body">
            <div class="field">
              <label class="label">Name</label>
              <div class="control">
                <input class="input" type="text" placeholder="John Shame" v-model="edit_player.guest_name">
              </div>
            </div>
            <div class="field">
              <label class="label">Position</label>
              <div class="control">
                <input class="input" type="text" placeholder="Mid" v-model="edit_player.guest_position">
              </div>
            </div>
          </template>
          <template slot="foot">
              <button class="button is-outlined is-success has-background-white" @click="update_guest()">Save</button>
              <button class="button is-outlined is-link has-background-white" @click="close_modal()">Cancel</button>
              <a class="is-text is-size-7 has-text-danger" @click="remove_guest">Remove</a>
          </template>
        </modal>

        <modal title="New player" name='new-player'>
          <template slot="body">
            <div class="field">
              <label class="label">First name</label>
              <div class="control">
                <input class="input" type="text" placeholder="John Shame" v-model="new_player.first_name">
              </div>
            </div>
            <div class="field">
              <label class="label">Last name</label>
              <div class="control">
                <input class="input" type="text" placeholder="John Shame" v-model="new_player.last_name">
              </div>
            </div>
            <div class="field">
              <label class="label">Position</label>
              <div class="control">
                <input class="input" type="text" placeholder="Mid" v-model="new_player.pos">
              </div>
            </div>
          </template>
          <template slot="foot">
              <button class="button is-outlined is-success has-background-white" @click="add_guest()">Add Player</button>
              <button class="button is-outlined is-link has-background-white" @click="close_modal()">Cancel</button>
          </template>
        </modal>
      </div>`,
  });

  $.ajax({type: "POST",
    url: apiLink,
    data: {
      action: 'event',
      id: get_query_value('event_id')
    },
    success: function(response){
      var result = JSON.parse(response);
      if (result.status != 0) {
        alert('error');
      } else {
        if (result.message != undefined) {
          const l_date = parse_date(result.message.date);

          currentEventInfo.start = l_date.toFormat(datetime_display_format);
          currentEventInfo.end = l_date.plus({ hours: 3 }).toFormat(datetime_display_format);
          currentEventInfo.location = result.message.location;
          currentEventInfo.payment_link = result.message.payment_link;

          playersList.players = result.message.guests;
        }
      }
    },
    error: function(response){
      alert('server error');
    }
  });
});

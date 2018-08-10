$(document).ready(function() {
  const navbar = new Vue({ el: '#navbar' });

  const shameList = new Vue({
    el: '#shame-list',
    data: {
      players: []
    },
    template:`
      <table class="table is-hoverable is-striped is-fullwidth">
        <thead>
          <th>Name</th>
        </thead>
        <tbody>
          <tr v-for="(player, index) in players">
            <td>
              {{ player.name }}
            </td>
          </tr>
        </tbody>
      </table>
    `,
  });

  $.ajax({type: "POST",
    url: apiLink,
    data: {
      action: 'shame'
    },
    success: function(response){
      var result = JSON.parse(response);
      if (result.status != 0) {
        alert('error: ' + result.message);
      } else {
        shameList.players = result.message
      }
    },
    error: function(response){
      alert('server error');
    }
  });
});

var apiLink = "cgi-bin/vb.cgi";

function action_reload(json) {
  $.ajax({type: "POST",
    url: apiLink,
    data: json,
    success: function(response){
      var result = JSON.parse(response);
      if (result.status != 0) {
        alert('error: ' + result.message);
      } else {
        window.location.reload();
      }
    },
    error: function(response){
      alert('server error');
    }
  });
}

// guest functions
function update_guest(guest_id) {
  var name = $('#guest_name_' + guest_id).text();

  if (confirm('Are you sure you want to update ' + name)) {
    var position = $('#guest_position_' + guest_id).val();
    var paid = $('#guest_paid_' + guest_id).is(':checked') ? 1 : 0;

    action_reload({
      action: 'update_guest',
      id: guest_id,
      position: position,
      is_paid: paid
    });
  }
}

function remove_guest(guest_id) {
  var name = $('#guest_name_' + guest_id).text();
  var p = prompt('Type yes to remove ' + name + '. This is permanent!');
  if (p == null) {
    return;
  }
  if (p.toUpperCase() != 'YES') {
    alert('Remove failed. You had to type yes to remove.');
    return;
  }
  action_reload({
    action: 'remove_guest',
    id: guest_id
  });
}

function add_guest() {
  var name = $('#guest_name_new').val();
  var position = $('#guest_position_new').val();

  action_reload({
    action: 'add_guest',
    event_id: 1,
    name: name,
    position: position
  });
}

// event functions
function update_event(event_id) {
  var event_date = $('#event_date_' + event_id).text();
  var loc = $('#event_location_' + event_id).val();
  var payment = $('#event_payment_' + event_id).val();

  if (confirm('Are you sure you want to event ' + event_date + ' in ' + loc)) {
    action_reload({
      action: 'update_event',
      id: event_id,
      date: event_date,
      location: loc,
      payment_link: payment
    });
  }
}

function add_event() {
  action_reload({
    action: 'add_event',
    date: $('#event_date_new').val(),
    location: $('#event_location_new').val(),
    payment_link: $('#event_payment_new').val()
  });
}

function set_primary_event(event_id) {
  action_reload({
    action: 'set_primary_event',
    id: event_id
  });
}
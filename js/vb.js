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
      position: position
    });
  }
}

// updates paid checkbox chkbx of a guest.
function update_paid(chkbx) {
  var guest_id = chkbx.attr('data-id');
  var name = $('#guest_name_' + guest_id).text();
  var paid = chkbx.is(':checked') ? 1 : 0;
  var paid_rollback = 1 - paid;

  if (confirm('Are you sure you want to update ' + name)) {
    chkbx.attr('disabled', true);

    $.ajax({type: "POST",
      url: apiLink,
      data: {
        action: 'update_guest',
        id: guest_id,
        is_paid: paid
      },
      success: function(response){
        var result = JSON.parse(response);
        if (result.status != 0) {
          alert('error: ' + result.message);
          chkbx.prop('checked', paid_rollback);
        } else {
          chkbx.prop('checked', paid);
        }
        chkbx.removeAttr('disabled');
      },
      error: function(response){
        alert('server error');
        chkbx.prop('checked', paid_rollback);
        chkbx.removeAttr('disabled');
      }
    });
  } else {
    chkbx.prop('checked', paid_rollback);
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

function add_guest(event_id) {
  var first_name = $('#guest_first_name_new').val();
  var last_name = $('#guest_last_name_new').val();
  var position = $('#guest_position_new').val();

  if (!first_name || !$.trim(first_name)) {
    alert('First name is missing');
    return;
  }

  if (!last_name || !$.trim(last_name)) {
    alert('Last name is missing');
    return;
  }

  if (!position || !$.trim(position)) {
    alert('Position is missing');
    return;
  }

  action_reload({
    action: 'add_guest',
    event_id: event_id,
    name: $.trim(first_name) + ' ' + $.trim(last_name),
    position: $.trim(position)
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

function get_query_value(key)
{
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


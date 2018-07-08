function action_reload(json) {
  $.ajax({type: "POST",
    url: "cgi-bin/vb.cgi",
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


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


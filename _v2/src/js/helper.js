const apiLink = "/cgi-bin/vb.cgi";
const datetime_parse_format = 'dd/MM/yyyy HH:mm';
const datetime_display_format = 'DDDD HH:mm';

function action_reload (json) {
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

function parse_date (date_string) {
  let l_date = luxon.DateTime.fromISO(date_string);
  if (l_date.invalid) {
    l_date = luxon.DateTime.fromFormat(date_string, datetime_parse_format);
  }

  return l_date;
}

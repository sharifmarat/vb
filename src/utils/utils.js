import firebase from "./firebase";

class Utils {
  alert = (text, duration = 5000) => {
    window.Materialize.toast(text, duration);
  };

  requestNotificationsPermission = async () => {
    await firebase.messaging().requestPermission();

    let currentToken = await firebase.messaging().getToken();

    if (currentToken) {
      this.subscribeForNotifications(currentToken);
      return currentToken;
    }

    return false;
  };

  subscribeForNotifications = token => {
    fetch(
      "https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/new_event",
      {
        method: "POST",
        headers: {
          Authorization:
            "key=AAAAzMx3NIg:APA91bF_5WmZ4w275Q_DeucE7Eo0hEyJk9DdWnR0sO9y2XhJeDocJjkbO5Xh6Mj2tt171v-PPA84C141UKuf2cWwvnWF3hXhq1ayeLJcJU2yzb0Z88QJTECjgWf3H7ReatcpZIyj67b4"
        }
      }
    );
  };
}

export default new Utils();

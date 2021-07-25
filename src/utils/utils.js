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
            "key=AAAAQe_HkEI:APA91bHeNaGLDB0IkkX4mtkhPMqhrcoZqYaY9lxrT4vZOP9NliLY8dpa5B9pGRUsjkF_Yv3xjBFTejhceN_DFIoGB1Dy6KlFHuem_VSK79RxeDey6oRch_ajyrBJyz--kBcgeY8mO7Zi"
        }
      }
    );
  };
}

export default new Utils();

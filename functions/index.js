const functions = require('firebase-functions');
const axios = require('axios');

exports.eventCreated = functions.https.onCall((data, context) => {
    let message = 'New event! ' + data.location + ' (' + data.address + ') on ' + data.date + ' ' + data.time;

    axios({
        method: 'post',
        url: 'https://fcm.googleapis.com/fcm/send',
        responseType: 'json',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'key=AAAAQe_HkEI:APA91bHeNaGLDB0IkkX4mtkhPMqhrcoZqYaY9lxrT4vZOP9NliLY8dpa5B9pGRUsjkF_Yv3xjBFTejhceN_DFIoGB1Dy6KlFHuem_VSK79RxeDey6oRch_ajyrBJyz--kBcgeY8mO7Zi'
        },
        data: {
            "notification": {
                "title": "New event!",
                "body": message,
                "click_action": data.link,
                "icon": "https://firebasestorage.googleapis.com/v0/b/volleyapp-thx-ivan.appspot.com/o/logo.png?alt=media&token=93b388a5-8669-44b0-9f85-a65e8dbfb90f"
            },
            "to": "/topics/new_event"
        }
    })
});
import firebase from "firebase/app";

import "firebase/database";
import "firebase/auth";
import "firebase/messaging";
import "firebase/functions";

export const config = require("./config/firebase.json");

firebase.initializeApp(config);

export default firebase;

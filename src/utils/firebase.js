import firebase from "firebase/compat/app";

import "firebase/compat/database";
import "firebase/compat/auth";
import "firebase/compat/messaging";
import "firebase/compat/functions";

const config = require("./config/firebase.json");

firebase.initializeApp(config);

export default firebase;

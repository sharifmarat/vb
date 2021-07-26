import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from "react-router-dom"

import './App.css'
import './Loaders.css'

import EventsList from './components/EventsList'
import Event from './components/Event'
import LoginForm from './components/LoginForm'

import firebase from './utils/firebase'
import Utils from './utils/utils'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPen, faUser, faTimes, faCalendar, faCalendarPlus, faLock, faLockOpen, faAngleDoubleLeft, faAngleDoubleRight, faBell, faMapMarker, faClock, faDollarSign, faVolleyballBall } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add([faPen, faUser, faTimes, faCalendar, faCalendarPlus, faLock, faLockOpen, faAngleDoubleLeft, faAngleDoubleRight, faBell, faMapMarker, faClock, faDollarSign, faVolleyballBall])

let EventRoute = (props) => {
    let eventId = props.match.params.eventId
    let event = props.events.future.find((event) => event.key === eventId)
    let locked = false;
    if (!event) {
        event = props.events.past.find((event) => event.key === eventId)
        locked = true;
    }

    if (event) {
        return (
            <div>
                <Event event={event} history={props.history} locked={locked} />
            </div>
        )
    } else {
        window.location.href = '/'
    }

}

let EventEditRoute = (props) => {
    let eventId = props.match.params.eventId

    let event = props.events.find((event) => event.key === eventId)

    return (
        <div>
            <Event event={event} history={props.history} locked={false} />
        </div>
    )
}

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            notificationToken: null,
            events: {
                future: [],
                past: []
            },
        }

        if (firebase.messaging.isSupported()) {
            firebase.messaging().usePublicVapidKey("BEDigdAi7913zKWLYvuZL0xZo_SUOy1dsCRIw01NBYJJfymV9fFZdHv48t7a1Ds-nCawgrRv_0kxHVnlkdH2gpE")

            firebase.messaging().onMessage(function (payload) {
                console.log('Message received. ', payload);
            })
        }
    }

    render() {
        return (
            <Router>
                {this.state.loading ? (
                    <div className="app-loader-container">
                        <div className="loader app-loader"></div>
                    </div>
                ) : (
                        <div>
                            <nav className="navbar navbar-expand-sm navbar-light bg-light mb-2 shadow-sm col">
                                <span className="navbar-brand">Volley<b>Ams</b></span>
                                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#main-menu" aria-controls="main-menu" aria-expanded="false" aria-label="Toggle navigation">
                                    <span className="navbar-toggler-icon"></span>
                                </button>

                                <div className="collapse navbar-collapse" id="main-menu">
                                    <div className="navbar-nav mr-auto mt-2 mt-sm-0">
                                        {this.state.notificationToken === null && (
                                            <span className="btn btn-success shadow-sm" onClick={this.subscribeForNotifications.bind(this)}>Notifications <FontAwesomeIcon icon="bell" /></span>
                                        )}
                                        {this.state.notificationToken === false && (
                                            <span className="btn text-danger disabled" title="Notifications OFF">
                                                <span className="d-inline-block d-lg-none">Notifications <b>OFF</b></span> <FontAwesomeIcon icon="bell" />
                                            </span>
                                        )}
                                        {this.state.notificationToken && (
                                            <span className="btn text-success disabled" title="Notifications ON">
                                                <span className="d-inline-block d-lg-none">Notifications <b>ON</b></span> <FontAwesomeIcon icon="bell" />
                                            </span>
                                        )}
                                    </div>
                                    <ul className="navbar-nav">
                                        <li className="nav-item dropdown">
                                            <span className="nav-link dropdown-toggle btn" id="navbarDropdownMenuLink" data-toggle="dropdown" aria-expanded="false">
                                                {this.state.user ? (
                                                    <span>{this.state.user.email}</span>
                                                ) : (
                                                        <span>Login (as admin)</span>
                                                    )}
                                            </span>
                                            <div className="dropdown-menu dropdown-menu-right dropdown-menu-login p-3" aria-labelledby="navbarDropdownMenuLink">
                                                <LoginForm />
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </nav>
                            <div className="container mt-4">
                                <div className="row no-gutters mb-4">
                                    <div className="col-12">
                                        <Route exact path="/" render={(props) => <EventsList events={this.state.events} {...props} />} />
                                        <Route exact path="/event/:eventId" render={(props) => <EventRoute events={this.state.events} {...props} />} />
                                        <Route exact path="/event/:eventId/edit" render={(props) => <EventEditRoute events={this.state.events} {...props} />} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
            </Router>
        );
    }

    componentDidMount() {
        let self = this
        if (firebase.messaging.isSupported()) {
            firebase.messaging().getToken().then(function (currentToken) {
                if (currentToken) {
                    self.setState({
                        notificationToken: currentToken
                    })

                    Utils.subscribeForNotifications(currentToken)
                }
            }).catch(function (error) {
                console.log(error);

                self.setState({
                    notificationToken: false
                })
            });
        } else {
            self.setState({
                notificationToken: false
            })
        }

        firebase.auth().onAuthStateChanged((user) => {
            this.showLoader()

            if (user) {
                this.setState({ user });
            } else {
                delete this.state.user;
            }

            firebase.database().ref('events').orderByChild('date').on('value', (snapshot) => {
                var events = {
                    future: [],
                    past: []
                }

                snapshot.forEach((event) => {
                    let data = event.val()
                    data.key = event.key
                    events.future.push(data)
                });
                events.future.reverse()

                if (!this.state.user) {
                    // no need to load past events if no user
                    this.setState({ events: events })
                    this.hideLoader()
                } else {
                    // load past events only if user is authorized
                    firebase.database().ref('past_events').orderByChild('date').on('value', (snapshotPast) => {
                        snapshotPast.forEach((event) => {
                            let data = event.val()
                            data.key = event.key
                            events.past.push(data)
                        });

                        events.past.reverse()

                        this.setState({ events: events })
                        this.hideLoader()
                    }, (error) => {
                        console.log(error);
                        this.setState({ events: events })
                        this.hideLoader()
                    });
                }
            });
        });
    }

    subscribeForNotifications() {
        Utils.requestNotificationsPermission().then((token) => {
            if (token) {
                this.setState({
                    notificationToken: token
                })
            }
        }).catch((error) => {
            this.setState({
                notificationToken: false
            })
        })
    }

    showLoader() {
        this.setState({ loading: true })
    }

    hideLoader() {
        this.setState({ loading: false })
    }
}

export default App;

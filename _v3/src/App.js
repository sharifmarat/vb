import React, { Component } from 'react'
import { BrowserRouter as Router, Route } from "react-router-dom"

import './App.css'
import './Loaders.css'

import EventsList from './components/EventsList'
import Event from './components/Event'
import LoginForm from './components/LoginForm'

import _ from 'underscore'

import firebase from './utils/firebase'
import Utils from './utils/utils'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPen, faUser, faTimes, faCalendar, faCalendarPlus, faLock, faLockOpen, faAngleDoubleLeft, faAngleDoubleRight, faBell, faMapMarker, faClock } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add([faPen, faUser, faTimes, faCalendar, faCalendarPlus, faLock, faLockOpen, faAngleDoubleLeft, faAngleDoubleRight, faBell, faMapMarker, faClock])

let EventRoute = (props) => {
    let eventId = props.match.params.eventId
    let event = props.events.future.concat(props.events.past).find((event) => event.key === eventId )

    if (event) {
        return (
            <div>
                <Event event={event} history={props.history} />
            </div>
        )
    } else {
        window.location.href = '/'
    }

}

let EventEditRoute = (props) => {
    let eventId = props.match.params.eventId

    let event = props.events.find((event) => event.key === eventId )

    return (
        <div>
            <Event event={event} history={props.history} />
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

            firebase.messaging().onMessage(function(payload) {
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
                                        <span className="btn btn-success shadow-sm" onClick={this.subscribeForNotifications.bind(this)}>Subscribe <FontAwesomeIcon icon="bell" /></span>
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
                        <div className="container-fluid">
                            <div className="row mb-2">
                                <div className="col">
                                    <div className="text-center">
                                        <span className="whats-new-button" data-toggle="modal" data-target="#whatsNewModal"><u>Version 2.0. What's new?</u></span>
                                    </div>

                                    <div className="modal fade" id="whatsNewModal" tabIndex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                                        <div className="modal-dialog" role="document">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <h5 className="modal-title" id="exampleModalLabel">What's new</h5>
                                                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                                    <span aria-hidden="true">&times;</span>
                                                    </button>
                                                </div>
                                                <div className="modal-body">
                                                    <ol>
                                                        <li>Receive the <b>notifications of new events</b>. To have it - press <span className="btn btn-sm btn-success disabled">Subscribe <FontAwesomeIcon icon="bell" /></span> button in the header and allow your browser to send the notifications to you.<p className="text-danger">Please note, that Safari, Firefox Focus and, may be, some other browsers do not support notifications so, yeah, <a href="https://www.google.com/chrome/" target="_blank" rel="noopener noreferrer">download Chrome</a>.</p></li>
                                                        <li>You can pin the website to homescreen and use as an app.</li>
                                                        <li>List of upcoming/past events.</li>
                                                        <li><b>Instant update</b> of events/participants' lists.</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="container">
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
            firebase.messaging().getToken().then(function(currentToken) {
                if (currentToken) {
                    self.setState({
                        notificationToken: currentToken
                    })

                    Utils.subscribeForNotifications(currentToken)
                }
            }).catch(function(error) {
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
                    data.playersPaid = _.where(data.players, {paid: true}).length
                    data.key = event.key


                    if (data.locked === true) {
                        events.past.push(data)
                    } else {
                        events.future.push(data)
                    }
                })

                events.past.reverse()
                events.future.reverse()

                this.setState({ events: events })
                this.hideLoader()
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

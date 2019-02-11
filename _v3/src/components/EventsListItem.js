import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import firebase from '../utils/firebase'

import { Link } from "react-router-dom"

import moment from 'moment'

class EventsListItem extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: firebase.auth().currentUser
        }
    }

    render() {
        return (
            <Link to={"/event/" + this.props.event.key} className="list-group-item list-group-item-action">
                <div className="row form-inline text-left">
                    <div className={"col-12 " + (this.state.user ? "col-md-3" : "col-md-4")}>
                        <label>
                            <FontAwesomeIcon icon="angle-double-right" className="d-inline d-md-none mr-1" /> <b>{this.props.event.location}</b>
                            {(this.props.event.playersPaid > 0 && this.props.event.locked !== true) && (
                                <span className="badge badge-danger ml-2" title="Paid"> <span className="d-inline-block d-md-none mr-1">Paid</span> {this.props.event.playersPaid} / {Object.keys(this.props.event.players).length}</span>
                            )}
                        </label>
                    </div>
                    <div className={"col-12 " + (this.state.user ? "col-md-3" : "col-md-4")}>
                        <label> <FontAwesomeIcon icon="map-marker" className="d-inline d-md-none mr-1" /> {this.props.event.address}</label>
                    </div>
                    <div className="col-12 col-md-4">
                        <label> <FontAwesomeIcon icon="clock" className="d-inline d-md-none mr-1" /> {moment(this.props.event.date).format('D MMM')}, {this.props.event.time}</label>
                    </div>
                    {this.state.user && (
                        <div className="col-12 col-md-2 text-center text-md-right mt-3 mt-md-0">
                            {this.props.event.locked ? (
                                <div className="btn btn-light shadow-sm" role="button" onClick={this.unlock.bind(this)} title="Unlock">
                                    <span className="d-inline-block d-md-none mr-1">Unlock</span>
                                    <FontAwesomeIcon icon="lock-open" />
                                </div>
                            ) : (
                                <div className="btn-group shadow-sm">
                                    <div className="btn btn-light" role="button" onClick={this.lock.bind(this)} title="Lock">
                                        <span className="d-inline-block d-md-none mr-1">Lock</span>
                                        <FontAwesomeIcon icon="lock" />
                                    </div>
                                    <div className="btn btn-danger" role="button" onClick={this.remove.bind(this)} title="Remove">
                                        <span className="d-inline-block d-md-none mr-1">Remove</span>
                                        <FontAwesomeIcon icon="calendar" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Link>
        );
    }

    remove(e) {
        e.preventDefault()

        if (window.confirm("Are you sure you want to remove the event '" + this.props.event.location + "'?")) {
            firebase.database().ref("/events/" + this.props.event.key).remove()
        }
    }

    lock(e) {
        e.preventDefault()

        if (window.confirm("Are you sure you want to lock the event '" + this.props.event.location + "'?")) {
            firebase.database().ref("/events/" + this.props.event.key).update({
                locked: true
            })
        }
    }

    unlock(e) {
        e.preventDefault()

        if (window.confirm("Are you sure you want to unlock the event '" + this.props.event.location + "'?")) {
            firebase.database().ref("/events/" + this.props.event.key).update({
                locked: false
            })
        }
    }
}

export default EventsListItem

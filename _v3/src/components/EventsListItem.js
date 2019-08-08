import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import _ from 'underscore'

import firebase from '../utils/firebase'

import { Link } from "react-router-dom"

import moment from 'moment'

class EventsListItem extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: firebase.auth().currentUser,
        }
    }

    render() {
        const times = this.props.event.time.split('-');

        // calculate if event is already finished
        const eventFinished = times[1] && moment().isAfter(`${this.props.event.date} ${times[1]}`, 'second');

        const playersCount = (this.props.event.players) ? Object.keys(this.props.event.players).length : 0;
        const playersPaid = _.where(this.props.event.players, { paid: true }).length;

        const step = 6;

        // There has to be at least 12 players to play
        let maxPlayers = 12;

        if (playersCount >= 12) {
            const currentFullTeams = Math.floor(playersCount / step);

            maxPlayers = Math.ceil((currentFullTeams + 1) * step);
        }

        const progressStyle = {
            height: '1.5rem',
            backgroundColor: (eventFinished) ? '#b2d8bb' : '#a3d7e0',
        };

        const progressBarStyle = {
            width: (
                (eventFinished) ?
                    (playersPaid / playersCount) :
                    (playersCount / maxPlayers)
            ) * 100 + '%'
        };

        const progressBarClasses = [
            'progress-bar',
            (eventFinished) ? 'bg-success' : 'bg-info'
        ];

        return (
            <Link to={"/event/" + this.props.event.key} className="list-group-item list-group-item-action py-4">
                <div className="row form-inline text-left">
                    <div className={"col-12 col-md-3"}>
                        <label>
                            <FontAwesomeIcon icon="angle-double-right" className="d-inline d-md-none mr-1" /> <b>{this.props.event.location}</b>
                        </label>
                    </div>
                    <div className={"col-12 col-md-3"}>
                        <label> <FontAwesomeIcon icon="map-marker" className="d-inline d-md-none mr-1" /> {this.props.event.address}</label>
                    </div>
                    <div className="col-12 col-md-3">
                        <label> <FontAwesomeIcon icon="clock" className="d-inline d-md-none mr-1" /> {moment(this.props.event.date).format('D MMM')}, {this.props.event.time}</label>
                    </div>
                    <div className="col-12 col-md-3">
                        {(this.props.event.locked !== true) &&
                            <div className="row">
                                <div className="col-auto">
                                    {eventFinished ? <span>Paid</span> : <span>Players</span>}
                                </div>
                                <div className="col">
                                    <div className="progress" style={progressStyle}>
                                        <div className={progressBarClasses.join(' ')} role="progressbar" style={progressBarStyle}>
                                            <span className="px-2 text-white text-center">
                                                {eventFinished ?
                                                    <span>{playersPaid} / {playersCount}</span>
                                                    :
                                                    <span>{playersCount} / {maxPlayers}</span>
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>

                {this.state.user && (
                    <div className="row mt-3">
                        <div className="col-12 text-center text-md-right mt-3 mt-md-0">
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
                    </div>
                )}
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

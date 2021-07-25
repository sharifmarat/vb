import React, { Component } from 'react'

import firebase from '../utils/firebase'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import EventsListItem from './EventsListItem'
import EventForm from './EventForm'

import moment from 'moment'

class EventsList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: firebase.auth().currentUser,
            editMode: false,
            location: "",
            address: "",
            date: "",
            time: ""
        }

        this.toggleEditMode = this.toggleEditMode.bind(this);
    }

    render() {
        return (
            <div>
                {this.state.user && (
                    <div>
                        {this.state.editMode ? (
                            <div className="jumbotron event-jumbotron shadow-sm">
                                <EventForm event={null} callback={this.toggleEditMode} />

                                <div className="btn btn-danger event-top-right-btn" role="button" onClick={this.toggleEditMode}>
                                    <FontAwesomeIcon icon="times" />
                                </div>
                            </div>
                        ) : (
                            <div className="text-right mb-3">
                                <div className="btn btn-success shadow-sm" role="button" onClick={this.toggleEditMode} title="New">
                                    <span className="d-inline-block d-md-none mr-1">New</span>
                                    <FontAwesomeIcon icon="calendar-plus" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {this.props.events.future.length > 0 ? (
                    <div className="list-group shadow-sm">
                        {this.props.events.future
                          .sort((first, second) => {
                            return moment(first.date) - moment(second.date);
                          })
                          .map((event, i) =>
                            <EventsListItem event={event} key={i} />
                        )}
                    </div>
                ) : (
                    <p>People are lazy and are not going to play soon.</p>
                )}

                <div>
                    <h5 className="text-center my-4">Past</h5>
                    {(this.props.events.past.length > 0 && this.state.user) ? (
                            <div className="list-group">
                                {this.props.events.past.map((event, i) =>
                                    <EventsListItem event={event} key={i} />
                                )}
                            </div>
                    ) : (
                        <p>Only admins can see past events</p>
                    )}
                </div>
            </div>
        );
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    toggleEditMode() {
        this.setState({
            editMode: !this.state.editMode,

            location: '',
            address: '',
            date: '',
            time: ''
        })
    }
}

export default EventsList

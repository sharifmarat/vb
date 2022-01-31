import React, { Component } from 'react'

import firebase, { config } from '../utils/firebase'

class EventForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            location: (this.props.event) ? this.props.event.location : "",
            address: (this.props.event) ? this.props.event.address : "",
            date: (this.props.event) ? this.props.event.date : "",
            time: (this.props.event) ? this.props.event.time : "",
            paymentLink: (this.props.event) ? this.props.event.paymentLink : "",
        }
    }

    render() {
        return (
            <div>
                {!this.props.event && (
                    <h4>New event</h4>
                )}
                <form className="form" onSubmit={this.saveEvent.bind(this)}>
                    <div className="form-group">
                        <label htmlFor="location">Location</label>
                        <input type="text" required className="form-control" id="location" name="location" value={this.state.location} onChange={this.handleChange.bind(this)} placeholder="Location" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <input type="text" required className="form-control" id="address" name="address" value={this.state.address} onChange={this.handleChange.bind(this)} placeholder="Address" />
                    </div>
                    <div className="form-row">
                        <div className="form-group col-12 col-sm-8">
                            <label htmlFor="date">Date</label>
                            <input type="date" required className="form-control" id="date" name="date" value={this.state.date} onChange={this.handleChange.bind(this)} placeholder="Date" />
                        </div>
                        <div className="form-group col-12 col-sm-4">
                            <label htmlFor="time">Time</label>
                            <input type="text" required className="form-control" id="time" name="time" value={this.state.time} onChange={this.handleChange.bind(this)} placeholder="hh:mm - hh:mm" />
                        </div>
                    </div>
                    {config.trackPayments && (
                        <div className="form-group">
                            <label htmlFor="paymentLink">Payment link</label>
                            <input type="text" className="form-control" id="paymentLink" name="paymentLink" value={this.state.paymentLink} onChange={this.handleChange.bind(this)} placeholder="Payment link" />
                        </div>
                    )}
                    <button type="submit" className="btn btn-success shadow-sm">Save</button>
                </form>
            </div>
        );
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    saveEvent(e) {
        e.preventDefault()
        let self = this

        if (this.props.event) {
            firebase.database().ref("/events/" + this.props.event.key).update({
                location: this.state.location,
                address: this.state.address,
                date: this.state.date,
                time: this.state.time,
                paymentLink: this.state.paymentLink
            }).then(() => {
                if (self.props.callback) {
                    self.props.callback()
                }
            }).catch((error) => {
                alert(error)
            })
        } else {
            firebase.database().ref("/events/").push({
                location: this.state.location,
                address: this.state.address,
                date: this.state.date,
                time: this.state.time,
                paymentLink: this.state.paymentLink
            }).then((data) => {
                if (self.props.callback) {
                    self.props.callback()
                }
            }).catch((error) => {
                alert(error)
            })
        }
    }
}

export default EventForm

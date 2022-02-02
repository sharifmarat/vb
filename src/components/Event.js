import React, { Component } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import firebase from "../utils/firebase";

// import Breadcrumbs from '../helpers/Breadcrumbs'

import moment from "moment";

import PlayersList from "./PlayersList";
import EventForm from "./EventForm";

class Event extends Component {
  constructor(props) {
    super(props);

    this.state = {
      user: firebase.auth().currentUser,
      editMode: false
    };

    this.toggleEditMode = this.toggleEditMode.bind(this);
  }

  render() {
    return (
      <div>
        <div className="jumbotron event-jumbotron">
          <Link className="btn btn-dark event-top-left-btn" ole="button" to="/">
            <FontAwesomeIcon icon="angle-double-left" />
          </Link>
          {this.state.editMode &&
            !this.props.locked &&
            this.state.user ? (
              <div>
                <EventForm
                  event={this.props.event}
                  callback={this.toggleEditMode}
                />

                <div
                  className="btn btn-danger event-top-right-btn"
                  role="button"
                  onClick={this.toggleEditMode}
                >
                  <FontAwesomeIcon icon="times" />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="display-4 d-inline-block mr-3">
                  {this.props.event.location}
                </h1>
                <h3 className="d-inline-block">({this.props.event.address})</h3>
                <p className="lead">
                  {moment(this.props.event.date).format("ddd, D MMM")},{" "}
                  {this.props.event.time}
                </p>
                {this.props.event.paymentLink && (
                  <p className="lead payment-link">
                    <a
                      href={this.props.event.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {this.props.event.paymentLink}
                    </a>
                  </p>
                )}
                {this.props.event.maxPlayers && parseInt(this.props.event.maxPlayers) && (
                  <p className="lead">
                    Max players: {this.props.event.maxPlayers}
                  </p>
                )}
                {this.state.user && !this.props.locked && (
                  <div
                    className="btn btn-dark event-top-right-btn"
                    role="button"
                    onClick={this.toggleEditMode}
                  >
                    <FontAwesomeIcon icon="pen" />
                  </div>
                )}
              </div>
            )}
        </div>

        <PlayersList
          players={this.props.event.players}
          event={this.props.event}
          locked={this.props.locked}
        />

        <div className="text-right mt-4">
          <button
            type="submit"
            className="btn"
            onClick={this.copePlayersList.bind(this)}
          >
            Copy players names/positions
          </button>
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

      location: this.props.event.location,
      address: this.props.event.address,
      date: this.props.event.date,
      time: this.props.event.time
    });
  }

  copePlayersList() {
    let copyText = "";

    Object.keys(this.props.event.players).forEach((key) => {
      copyText += `${this.props.event.players[key].firstname} ${
        this.props.event.players[key].lastname
        }\t${this.props.event.players[key].position}\n`;
    });

    const el = document.createElement("textarea");
    el.style.position = "fixed";
    el.style.bottom = 0;
    el.style.left = 0;
    el.value = copyText;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);

    window.alert("Copeid into the clipboard");
  }
}

export default Event;

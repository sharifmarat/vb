import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import moment from "moment";

import firebase, { config } from '../utils/firebase';

class PlayersListItem extends Component {
  timeoutTime = 1000;

  constructor(props) {
    super(props);

    this.state = {
      position: props.player.position,
      paid: props.player.paid,

      updateLoader: false,
      updateFinished: false,
      updateTimeout: 0
    };
  }

  render() {
    return (
      <div>
        <div className="row form-inline text-left">
          {(this.state.updateLoader || this.state.updateFinished) && (
            <div className="player-loader-container">
              {this.state.updateLoader && (
                <div className="loader player-loader" />
              )}
              {this.state.updateFinished && (
                <div className="text-success save-confirmation">
                  <b className="ml-1">SAVED</b>
                </div>
              )}
            </div>
          )}

          <div className="col-1">
            <label>{this.props.index + 1}</label>
          </div>
          <div className="col-6 col-sm-5 col-lg-6">
            <label>
              {this.props.player.firstname} {this.props.player.lastname}
            </label>
          </div>
          <div className="col-3 col-sm-3">
            <input
              className="form-control"
              type="text"
              name="position"
              value={this.state.position}
              onChange={this.changePosition.bind(this)}
              disabled={this.props.locked ? true : false}
            />
          </div>
          <div className="col-2 col-sm-1">
              {config.trackPayments && (
                  <input
                    type="checkbox"
                    className="form-check-input paid-checkbox"
                    checked={this.state.paid}
                    onChange={this.changePaid.bind(this)}
                    disabled={this.props.locked ? true : false}
                  />
              )}
          </div>
          <div className="col-12 col-sm-2 col-lg-1 text-center text-sm-right mt-3 mt-sm-0">
            {!this.props.locked && (
              <div
                className="btn btn-danger shadow-sm"
                onClick={this.remove.bind(this)}
                title="Sign out"
              >
                <span className="d-inline-block d-sm-none mr-1">Sign out</span>
                <FontAwesomeIcon icon="user" />
              </div>
            )}
          </div>
        </div>
        <hr />
      </div>
    );
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.player.position !== this.state.position ||
      nextProps.player.paid !== this.state.paid
    ) {
      this.setState({
        position: nextProps.player.position,
        paid: nextProps.player.paid
      });
    }
  }

  remove(e) {
    e.preventDefault();

    const fullName =
      this.props.player.firstname + " " + this.props.player.lastname;

    if (window.confirm("Are you sure you want to sign " + fullName + " out?")) {
      firebase
        .database()
        .ref(
          "/events/" +
          this.props.event.key +
          "/players/" +
          this.props.player.key
        )
        .remove()
        .then(() => {
          let alert = `Shame, ${fullName}!`;

          const eventDate = moment(this.props.event.date);

          alert +=
            " Please, make sure that you announce in the group that you are not coming, so we can find a replacement!";

          const pushMessage = `${fullName} has just been removed from the list for ${
            this.props.event.location
            } on ${eventDate.format("dddd")} (${this.props.event.date})`;

          fetch(config.notifyURL + pushMessage);

          window.alert(alert);
        });
    }
  }

  changePosition(e) {
    let self = this;

    if (this.state.updateTimeout) {
      clearTimeout(this.state.updateTimeout);
    }

    this.setState({
      position: e.target.value,
      updateTimeout: setTimeout(function () {
        self.setState({
          updateFinished: false,
          updateLoader: true
        });

        setTimeout(function () {
          firebase
            .database()
            .ref(
              "/events/" +
              self.props.event.key +
              "/players/" +
              self.props.player.key +
              "/"
            )
            .update({
              position: self.state.position
            })
            .then(() => {
              self.setState({
                updateLoader: false,
                updateFinished: true,
                updateTimeout: setTimeout(function () {
                  self.setState({ updateFinished: false });
                }, self.timeoutTime * 1.5)
              });
            })
            .catch(error => {
              alert(error);
            });
        }, self.timeoutTime);
      }, this.timeoutTime)
    });
  }

  changePaid(e) {
    let self = this;
    this.setState({ paid: e.target.checked });

    if (this.state.updateTimeout) {
      clearTimeout(this.state.updateTimeout);
    }

    this.setState({
      updateFinished: false,
      updateLoader: true,
      updateTimeout: setTimeout(function () {
        firebase
          .database()
          .ref(
            "/events/" +
            self.props.event.key +
            "/players/" +
            self.props.player.key +
            "/"
          )
          .update({
            paid: self.state.paid
          })
          .then(() => {
            self.setState({
              updateLoader: false,
              updateFinished: true,
              updateTimeout: setTimeout(function () {
                self.setState({ updateFinished: false });
              }, self.timeoutTime * 1.5)
            });
          })
          .catch(error => {
            alert(error);
          });
      }, this.timeoutTime)
    });
  }
}

export default PlayersListItem;

import React, { Component } from 'react'

import PlayersListItem from './PlayersListItem'
import NewPlayersListItem from './NewPlayersListItem'

class PlayersList extends Component {
    render() {
        return (
            <div>
                {this.props.players ? (
                    <div className="players-list">
                        <div className="row form-inline text-left">
                            <div className="col-1">
                                <label>#</label>
                            </div>
                            <div className="col-6 col-sm-5 col-lg-6">
                                <label>Name</label>
                            </div>
                            <div className="col-3 col-sm-3">
                                <label>Position</label>
                            </div>
                            <div className="col-2 col-sm-3 col-lg-2">
                                <label>Paid</label>
                            </div>
                        </div>
                        <hr />
                        {Object.keys(this.props.players).map((key, index) =>
                            <PlayersListItem player={{...this.props.players[key], key: key}} key={index} index={index} event={this.props.event} />
                        )}
                    </div>
                ) : (
                    <div>
                        {!this.props.event.locked ? (
                            <div>
                                <p>
                                    Be the first one to sign up!
                                </p>
                                <hr />
                            </div>
                        ) : (
                            <p>Nobody signed up.</p>
                        )}
                    </div>
                )}
                {!this.props.event.locked && (
                    <NewPlayersListItem eventKey={this.props.event.key} />
                )}
            </div>
        );
    }
}

export default PlayersList

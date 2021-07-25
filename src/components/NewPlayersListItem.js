import React, { Component } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import firebase from '../utils/firebase'

class NewPlayersListItem extends Component {
    timeoutTime = 1000;

    constructor(props) {
        super(props);


        this.state = {
            firstname: "",
            lastname: "",
            position: ""
        }
    }

    render() {
        return (
            <div>
                <form className="row form-inline text-left" onSubmit={this.addPlayer.bind(this)}>
                    <div className="d-none d-sm-block col-1">
                        <label><strong>N</strong></label>
                    </div>
                    <div className="col-4 col-sm-3 col-md-2 col-lg-3">
                        <div className="input-group">
                            <input className="form-control" required type="text" placeholder="First name" name="firstname" value={this.state.firstname} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>
                    <div className="col-4 col-sm-3">
                        <div className="input-group">
                            <input className="form-control" required type="text" placeholder="Last name" name="lastname" value={this.state.lastname} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>

                    <div className="col-4 col-sm-3">
                        <div className="input-group">
                            <input className="form-control" required type="text" placeholder="Position" name="position" value={this.state.position} onChange={this.handleChange.bind(this)} />
                        </div>
                    </div>
                    <div className="col-12 col-sm-2 offset-md-1 col-lg-1 text-center text-sm-right mt-3 mt-sm-0">
                        <button type="submit" className="btn btn-success shadow-sm" title="Sign up">
                            <span className="d-inline-block d-sm-none mr-1">Sign up</span>
                            <FontAwesomeIcon icon="user" />
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    handleChange (e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    addPlayer(e) {
        e.preventDefault()

        let self = this

        firebase.database().ref("/events/" + self.props.eventKey + "/players/" + (new Date().getTime())).update({
            firstname: this.state.firstname,
            lastname: this.state.lastname,
            position: this.state.position,
            paid: false
        }).then(() => {
            self.setState({
                firstname: "",
                lastname: "",
                position: ""
            })
        }).catch((error) => {
            alert(error);
        })
    }
}

export default NewPlayersListItem

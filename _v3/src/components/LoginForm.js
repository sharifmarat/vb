import React, { Component } from 'react'

import firebase from '../utils/firebase'

class LoginForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: firebase.auth().currentUser,
            email: "",
            password: ""
        }
    }

    render() {
        return (
            <div>
                {this.state.user ? (
                    <form onSubmit={this.logout.bind(this)}>
                        <button type="submit" className="btn form-control btn-primary">Logout</button>
                    </form>
                ) : (
                    <form onSubmit={this.login.bind(this)}>
                        <div className="form-group">
                            <input type="email" className="form-control mb-2 mb-md-0 mr-sm-2" name="email" id="email" placeholder="Enter email" onChange={this.handleChange.bind(this)} />
                        </div>
                        <div className="form-group">
                            <input type="password" className="form-control mb-2 mb-md-0 mr-sm-2" name="password" id="password" placeholder="Enter password" onChange={this.handleChange.bind(this)} />
                        </div>
                        <button type="submit" className="btn form-control btn-primary">Login</button>
                    </form>
                )}
            </div>
        );
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    login(e) {
        e.preventDefault()

        firebase.auth().signInWithEmailAndPassword(this.state.email, this.state.password).catch(function(error) {
            alert(error.message);
        });
    }

    logout(e) {
        e.preventDefault()
        firebase.auth().signOut()
            .then(() => {
                this.setState({
                    user: null
                });
            });
    }
}

export default LoginForm

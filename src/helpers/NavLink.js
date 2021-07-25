import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class NavLink extends React.Component {
    render() {
        var isActive = this.context.router.route.location.pathname === this.props.to;
        let className = "nav-item " + (isActive ? "active" : "");

        return(
            <li className={className}>
                <Link className="nav-link" to={this.props.to}>
                    {this.props.children}
                </Link>
            </li>
        );
    }
}

NavLink.contextTypes = {
    router: PropTypes.object
};

export default NavLink;
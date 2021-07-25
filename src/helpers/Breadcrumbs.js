import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class Breadcrumbs extends React.Component {
    render() {
        return(
            <nav>
                <ol className="breadcrumb">
                    {this.props.breadcrumbs.map((breadcrumb, i) =>
                        <li className={"breadcrumb-item" + (breadcrumb.link ? "": " active")} key={i}>
                            {(breadcrumb.link) ? (
                                <Link to={breadcrumb.link}>
                                    {breadcrumb.title}
                                </Link>
                            ) : (
                                <span>{breadcrumb.title}</span>
                            )}
                        </li>
                    )}
                </ol>
            </nav>
        );
    }
}

Breadcrumbs.contextTypes = {
    router: PropTypes.object
};

export default Breadcrumbs;
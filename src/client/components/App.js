import React, { Component, Fragment } from 'react';
import Header from './Header';
import Button from '@material-ui/core/Button';


class App extends Component {
    constructor(props) {
        super(props);

        this.state = {

        }
    }

    render() {
        return <Fragment>
            <Header />
            <Button variant="contained" color="primary">
              Hello World
            </Button>
        </Fragment>
    }
}

export default App;

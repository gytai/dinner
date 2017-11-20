import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Login from './Login';
import Register from './Register';
import pastry from './Pastry';
import registerServiceWorker from './registerServiceWorker';
import {
    BrowserRouter as Router,
    Route,
    Switch
} from 'react-router-dom'

ReactDOM.render((
    <Router>
        <Switch>
            <Route exact path="/" component={App}/>
            <Route path="/login" component={Login}/>
            <Route path="/register" component={Register}/>
            <Route path="/pastry" component={pastry}/>
        </Switch>
    </Router>
), document.getElementById('root'));
registerServiceWorker();

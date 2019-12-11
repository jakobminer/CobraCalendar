import React from 'react';
import { Router, Route, Switch } from 'react-router';
import createBrowserHistory from 'history/createBrowserHistory';

// route components
import App from '../imports/ui/App.jsx';
import LogInScreen from '../imports/ui/LogInScreen';
import Authenticated from './Authenticated';
import Public from './Public';
import { useTracker } from 'meteor/react-meteor-data';

const browserHistory = createBrowserHistory();

export const RenderRoutes = () => {
  const user = useTracker( () => Meteor.user() );
  const authenticated = useTracker( () => Meteor.userId() != null);
  const loggingIn = useTracker(() => Meteor.loggingIn());
  console.log('user state: ', user, authenticated, loggingIn);
  return (
      <Router history={browserHistory}>
        <Switch>
          <Route exact path="/login" component={LogInScreen} authenticated={authenticated} loggingIn={loggingIn} />
          <Authenticated exact path="/" component={App} authenticated={authenticated} loggingIn={loggingIn} />
        </Switch>
      </Router>
  );
};
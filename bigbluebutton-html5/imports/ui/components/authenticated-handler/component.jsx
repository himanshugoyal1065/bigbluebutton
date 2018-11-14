import React, { Component } from 'react';
import { Session } from 'meteor/session';
import _ from 'lodash';
import { log } from '/imports/ui/services/api';
import Auth from '/imports/ui/services/auth';
import LoadingScreen from '/imports/ui/components/loading-screen/component';

const STATUS_CONNECTING = 'connecting';

class AuthenticatedHandler extends Component {
  static setError(codeError) {
    Session.set('hasError', true);
    if (codeError) Session.set('codeError', codeError);
  }
  static shouldAuthenticate(status, lastStatus) {
    return lastStatus != null && lastStatus === STATUS_CONNECTING && status.connected;
  }

  static updateStatus(status, lastStatus) {
    return status.retryCount > 0 && lastStatus !== STATUS_CONNECTING ? status.status : lastStatus;
  }

  static addReconnectObservable() {
    let lastStatus = null;

    Tracker.autorun(() => {
      lastStatus = AuthenticatedHandler.updateStatus(Meteor.status(), lastStatus);

      if (AuthenticatedHandler.shouldAuthenticate(Meteor.status(), lastStatus)) {
        Auth.authenticate(true);
        lastStatus = Meteor.status().status;
      }
    });
  }
  static authenticatedRouteHandler(callback) {
    if (Auth.loggedIn) {
      callback();
    }

    AuthenticatedHandler.addReconnectObservable();

    Auth.authenticate()
      .then(callback)
      .catch((reason) => {
        log('error', reason);
        AuthenticatedHandler.setError(reason.error);
        callback();
      });
  }
  constructor(props) {
    super(props);
    this.changeState = this.changeState.bind(this);
    this.state = {
      authenticated: false,
    };
  }

  componentDidMount() {
    AuthenticatedHandler.authenticatedRouteHandler((value, error) => {
      if (error) AuthenticatedHandler.setError(error);
      this.changeState(true);
    });
  }

  changeState(state) {
    this.setState({ authenticated: state });
  }

  render() {
    const {
      children,
    } = this.props;
    const {
      authenticated,
    } = this.state;

    Session.set('isChatOpen', false);
    Session.set('idChatOpen', '');
    Session.set('isMeetingEnded', false);
    Session.set('isPollOpen', false);
    Session.set('breakoutRoomIsOpen', false);

    return authenticated
      ? children
      : (<LoadingScreen />);
  }
}


export default AuthenticatedHandler;

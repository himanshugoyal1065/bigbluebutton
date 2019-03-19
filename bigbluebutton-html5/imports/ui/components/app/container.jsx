import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { defineMessages, injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Auth from '/imports/ui/services/auth';
import Users from '/imports/api/users';
import Meetings from '/imports/api/meetings';

import ClosedCaptionsContainer from '/imports/ui/components/closed-captions/container';
import getFromUserSettings from '/imports/ui/services/users-settings';

import {
  getFontSize,
  getCaptionsStatus,
  getBreakoutRooms,
} from './service';

import { withModalMounter } from '../modal/service';

import App from './component';
import NavBarContainer from '../nav-bar/container';
import ActionsBarContainer from '../actions-bar/container';
import MediaContainer from '../media/container';

const propTypes = {
  navbar: PropTypes.node,
  actionsbar: PropTypes.node,
  media: PropTypes.node,
};

const defaultProps = {
  navbar: <NavBarContainer />,
  actionsbar: <ActionsBarContainer />,
  media: <MediaContainer />,
};

const intlMessages = defineMessages({
  waitingApprovalMessage: {
    id: 'app.guest.waiting',
    description: 'Message while a guest is waiting to be approved',
  },
});

const endMeeting = (code) => {
  Session.set('codeError', code);
  Session.set('isMeetingEnded', true);
};

const AppContainer = (props) => {
  const {
    navbar,
    actionsbar,
    media,
    ...otherProps
  } = props;

  return (
    <App
      navbar={navbar}
      actionsbar={actionsbar}
      media={media}
      {...otherProps}
    />
  );
};

export default injectIntl(withModalMounter(withTracker(({ intl, baseControls }) => {
  const currentUser = Users.findOne({ userId: Auth.userID });
  const meeting = Meetings.findOne({ meetingId: Auth.meetingID });

  if (!currentUser.approved) {
    baseControls.updateLoadingState(intl.formatMessage(intlMessages.waitingApprovalMessage));
  }

  // Check if user is removed out of the session
  Users.find({ userId: Auth.userID }).observeChanges({
    changed(id, fields) {
      const hasNewConnection = 'connectionId' in fields && (fields.connectionId !== Meteor.connection._lastSessionId);

      if (fields.ejected || hasNewConnection) {
        endMeeting('403');
      }
    },
  });

  if (meeting && meeting.meetingEnded) window.close();

  return {
    closedCaption: getCaptionsStatus() ? <ClosedCaptionsContainer /> : null,
    fontSize: getFontSize(),
    hasBreakoutRooms: getBreakoutRooms().length > 0,
    customStyle: getFromUserSettings('customStyle', false),
    customStyleUrl: getFromUserSettings('customStyleUrl', false),
    breakoutRoomIsOpen: Session.equals('openPanel', 'breakoutroom'),
    chatIsOpen: Session.equals('openPanel', 'chat'),
    openPanel: Session.get('openPanel'),
    userListIsOpen: !Session.equals('openPanel', ''),
  };
})(AppContainer)));

AppContainer.defaultProps = defaultProps;
AppContainer.propTypes = propTypes;

import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import VoiceUsers from '/imports/api/voice-users';
import Auth from '/imports/ui/services/auth';
import Users from '/imports/api/users';
import TalkingIndicator from './component';
import Service from './service';

const APP_CONFIG = Meteor.settings.public.app;
const { enableTalkingIndicator } = APP_CONFIG;

const TalkingIndicatorContainer = (props) => {
  if (!enableTalkingIndicator) return null;
  return (<TalkingIndicator {...props} />);
};

export default withTracker(() => {
  const talkers = {};
  const meetingId = Auth.meetingID;
  const usersTalking = VoiceUsers.find({ meetingId, joined: true, spoke: true }, {
    fields: {
      callerName: 1,
      talking: 1,
      color: 1,
      startTime: 1,
    },
  }).fetch().sort(Service.sortVoiceUsers);

  if (usersTalking) {
    usersTalking.forEach((user) => {
      const { callerName, talking, color } = user;
      talkers[`${callerName}`] = {
        color,
        talking,
      };
    });
  }

  return {
    talkers,
  };
})(TalkingIndicatorContainer);

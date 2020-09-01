import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import RedisPubSub from '/imports/startup/server/redis';
import Logger from '/imports/startup/server/logger';
import Users from '/imports/api/users';
import ClientConnections from '/imports/startup/server/ClientConnections';

export default function userLeaving(meetingId, userId, connectionId) {
  const REDIS_CONFIG = Meteor.settings.private.redis;
  const CHANNEL = REDIS_CONFIG.channels.toAkkaApps;
  const EVENT_NAME = 'UserLeaveReqMsg';

  check(userId, String);

  const selector = {
    meetingId,
    userId,
  };

  const User = Users.findOne(selector);

  if (!User) {
    return Logger.info(`Skipping userLeaving. Could not find ${userId} in ${meetingId}`);
  }

  // If the current user connection is not the same that triggered the leave we skip
  if (User.connectionId !== connectionId) {
    return false;
  }

  const payload = {
    userId,
    sessionId: meetingId,
  };

  ClientConnections.removeClientConnection(`${meetingId}--${userId}`, connectionId);

  Logger.info(`User '${userId}' is leaving meeting '${meetingId}'`);
  return RedisPubSub.publishUserMessage(CHANNEL, EVENT_NAME, meetingId, userId, payload);
}

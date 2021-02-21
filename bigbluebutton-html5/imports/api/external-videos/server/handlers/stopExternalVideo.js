import { check } from 'meteor/check';
import Logger from '/imports/startup/server/logger';
import Meetings from '/imports/api/meetings';

export default function handleStopExternalVideo({ header, body }, meetingId) {
  const { userId } = header;
  check(body, Object);
  check(meetingId, String);
  check(userId, String);

  Logger.info(`External video stop sharing was initiated by:[${userId}] for meeting ${meetingId}`);
  Meetings.update({ meetingId }, { $set: { externalVideoUrl: null } });
}

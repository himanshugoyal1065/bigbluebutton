import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { withModalMounter } from '/imports/ui/components/modal/service';
import AudioModal from './component';
import Service from '../service';

const AudioModalContainer = props => <AudioModal {...props} />;

const APP_CONFIG = Meteor.settings.public.app;

const { listenOnlyMode, forceListenOnly, skipCheck } = APP_CONFIG;

export default withModalMounter(withTracker(({ mountModal }) =>
  ({
    closeModal: () => {
      if (!Service.isConnecting()) mountModal(null);
    },
    joinMicrophone: () => {
      if (skipCheck) {
        return new Promise((resolve, reject) => {
          Service.joinMicrophone().then(() => {
            mountModal(null);
            resolve();
          }).catch(() => {
            Service.exitAudio();
            reject();
          });
        });
      }
      return new Promise((resolve, reject) => {
        Service.transferCall().then(() => {
          mountModal(null);
          resolve();
        }).catch(() => {
          Service.exitAudio();
          reject();
        });
      });
    },
    joinListenOnly: () => Service.joinListenOnly().then(() => mountModal(null)),
    leaveEchoTest: () => {
      if (!Service.isEchoTest()) {
        return Promise.resolve();
      }
      return Service.exitAudio();
    },
    changeInputDevice: inputDeviceId => Service.changeInputDevice(inputDeviceId),
    changeOutputDevice: outputDeviceId => Service.changeOutputDevice(outputDeviceId),
    joinEchoTest: () => Service.joinEchoTest(),
    exitAudio: () => Service.exitAudio(),
    isConnecting: Service.isConnecting(),
    isConnected: Service.isConnected(),
    isEchoTest: Service.isEchoTest(),
    inputDeviceId: Service.inputDeviceId(),
    outputDeviceId: Service.outputDeviceId(),
    showPermissionsOvelay: Service.isWaitingPermissions(),
    listenOnlyMode,
    skipCheck,
    joinFullAudioImmediately: !listenOnlyMode && skipCheck,
    joinFullAudioEchoTest: !listenOnlyMode && !skipCheck,
    forceListenOnlyAttendee: listenOnlyMode && forceListenOnly && !Service.isUserModerator(),
  }))(AudioModalContainer));

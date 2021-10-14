import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { withModalMounter } from '/imports/ui/components/modal/service';
import Modal from '/imports/ui/components/modal/fullscreen/component';
import logger from '/imports/startup/client/logger';
import PropTypes from 'prop-types';
import AudioService from '../audio/service';
import VideoService from '../video-provider/service';
import { screenshareHasEnded } from '/imports/ui/components/screenshare/service';
import UserListService from '/imports/ui/components/user-list/service';
import { styles } from './styles';

const intlMessages = defineMessages({
  title: {
    id: 'app.breakoutJoinConfirmation.title',
    description: 'Join breakout room title',
  },
  message: {
    id: 'app.breakoutJoinConfirmation.message',
    description: 'Join breakout confirm message',
  },
  freeJoinMessage: {
    id: 'app.breakoutJoinConfirmation.freeJoinMessage',
    description: 'Join breakout confirm message',
  },
  confirmLabel: {
    id: 'app.createBreakoutRoom.join',
    description: 'Join confirmation button label',
  },
  confirmDesc: {
    id: 'app.breakoutJoinConfirmation.confirmDesc',
    description: 'adds context to confirm option',
  },
  dismissLabel: {
    id: 'app.breakoutJoinConfirmation.dismissLabel',
    description: 'Cancel button label',
  },
  dismissDesc: {
    id: 'app.breakoutJoinConfirmation.dismissDesc',
    description: 'adds context to dismiss option',
  },
  generatingURL: {
    id: 'app.createBreakoutRoom.generatingURLMessage',
    description: 'label for generating breakout room url',
  },
});

const propTypes = {
  intl: PropTypes.object.isRequired,
  breakout: PropTypes.objectOf(Object).isRequired,
  getURL: PropTypes.func.isRequired,
  mountModal: PropTypes.func.isRequired,
  breakoutURL: PropTypes.string.isRequired,
  isFreeJoin: PropTypes.bool.isRequired,
  voiceUserJoined: PropTypes.bool.isRequired,
  requestJoinURL: PropTypes.func.isRequired,
  breakouts: PropTypes.arrayOf(Object).isRequired,
  breakoutName: PropTypes.string.isRequired,
};

let interval = null;

class BreakoutJoinConfirmation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectValue: props.breakout.breakoutId,
      waiting: true,
    };

    this.handleJoinBreakoutConfirmation = this.handleJoinBreakoutConfirmation.bind(this);
    this.renderSelectMeeting = this.renderSelectMeeting.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
  }

  componentDidMount() {
    const {
      isFreeJoin,
    } = this.props;

    const {
      selectValue,
    } = this.state;

    if (isFreeJoin) {
      this.fetchJoinURL(selectValue);
    } else {
      this.setState({ waiting: false });
    }
  }

  componentWillUnmount() {
    if (interval) clearInterval(interval);
  }

  handleJoinBreakoutConfirmation() {
    const {
      getURL,
      mountModal,
      breakoutURL,
      isFreeJoin,
      voiceUserJoined,
      requestJoinURL,
    } = this.props;

    const { selectValue } = this.state;
    if (!getURL(selectValue)) {
      requestJoinURL(selectValue);
    }
    const urlFromSelectedRoom = getURL(selectValue);
    const url = isFreeJoin ? urlFromSelectedRoom : breakoutURL;

    // leave main room's audio, and stops video and screenshare when joining a breakout room
    if (voiceUserJoined) {
      AudioService.exitAudio();
      logger.info({
        logCode: 'breakoutjoinconfirmation_ended_audio',
        extraInfo: { logType: 'user_action' },
      }, 'joining breakout room closed audio in the main room');
    }

    VideoService.storeDeviceIds();
    VideoService.exitVideo();
    if (UserListService.amIPresenter()) screenshareHasEnded();
    if (url === '') {
      logger.error({
        logCode: 'breakoutjoinconfirmation_redirecting_to_url',
        extraInfo: { breakoutURL, isFreeJoin },
      }, 'joining breakout room but redirected to about://blank');
    }
    window.open(url);
    mountModal(null);
  }

  async fetchJoinURL(selectValue) {
    const {
      requestJoinURL,
      getURL,
    } = this.props;

    this.setState({ selectValue });

    if (!getURL(selectValue)) {
      requestJoinURL(selectValue);

      this.setState({ waiting: true });

      await new Promise((resolve) => {

        interval = setInterval(() => {
          const url = getURL(selectValue);

          if (url !== "") {
            resolve();
            clearInterval(interval);
            this.setState({ waiting: false });
          }
        }, 1000)
      })
    } else {
      this.setState({ waiting: false });
    }
  }

  handleSelectChange(e) {
    const { value } = e.target;

    this.fetchJoinURL(value);
  }

  renderSelectMeeting() {
    const { breakouts, intl } = this.props;
    const { selectValue, waiting, } = this.state;
    return (
      <div className={styles.selectParent}>
        {`${intl.formatMessage(intlMessages.freeJoinMessage)}`}
        <select
          className={styles.select}
          value={selectValue}
          onChange={this.handleSelectChange}
          disabled={waiting}
        >
          {
            breakouts.map(({ name, breakoutId }) => (
              <option
                key={breakoutId}
                value={breakoutId}
              >
                {name}
              </option>
            ))
          }
        </select>
        { waiting ? <span data-test="labelGeneratingURL">{intl.formatMessage(intlMessages.generatingURL)}</span> : null}
      </div>
    );
  }

  render() {
    const { intl, breakoutName, isFreeJoin } = this.props;
    const { waiting } = this.state;

    return (
      <Modal
        title={intl.formatMessage(intlMessages.title)}
        confirm={{
          callback: this.handleJoinBreakoutConfirmation,
          label: intl.formatMessage(intlMessages.confirmLabel),
          description: intl.formatMessage(intlMessages.confirmDesc),
          icon: 'popout_window',
          disabled: waiting,
        }}
        dismiss={{
          label: intl.formatMessage(intlMessages.dismissLabel),
          description: intl.formatMessage(intlMessages.dismissDesc),
        }}
      >
        { isFreeJoin ? this.renderSelectMeeting() : `${intl.formatMessage(intlMessages.message)} ${breakoutName}?`}
      </Modal>
    );
  }
}

export default withModalMounter(injectIntl(BreakoutJoinConfirmation));

BreakoutJoinConfirmation.propTypes = propTypes;

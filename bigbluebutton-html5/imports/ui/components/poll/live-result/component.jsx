import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';
import { styles } from './styles';

const intlMessages = defineMessages({
  usersTitle: {
    id: 'app.poll.liveResult.usersTitle',
    description: 'heading label for poll users',
  },
  responsesTitle: {
    id: 'app.poll.liveResult.responsesTitle',
    description: 'heading label for poll responses',
  },
});

class LiveResult extends Component {
  constructor(props) {
    super(props);

    this.getUnresponsive = this.getUnresponsive.bind(this);
    this.getRespondents = this.getRespondents.bind(this);
    this.getPollStats = this.getPollStats.bind(this);
  }

  getPollStats() {
    const { currentPoll } = this.props;

    const pollStats = [];

    if (currentPoll) {
      const {
        answers,
        numRespondents,
      } = currentPoll;

      if (answers) {
        answers.map((obj) => {
          const pct = Math.round(obj.numVotes / numRespondents * 100);

          return pollStats.push(<div className={styles.main} key={_.uniqueId('stats-')}>
            <div className={styles.left}>
              {obj.key}
            </div>
            <div className={styles.center}>
              {obj.numVotes}
            </div>
            <div className={styles.right}>
              {`${isNaN(pct) ? 0 : pct}%`}
            </div>
          </div>);
        });
      }
    }

    return pollStats;
  }

  getRespondents() {
    const { currentPoll, getUser } = this.props;

    if (!currentPoll) return null;

    const respondedUsers = [];

    if (currentPoll) {
      const {
        answers,
        responses,
      } = currentPoll;

      if (responses && answers) {
        responses.map((ur) => {
          const user = getUser(ur.userId);
          if (user) {
            answers.map((obj) => {
              if (obj.id === ur.answerId) {
                respondedUsers.push(<div className={styles.item} key={_.uniqueId('stats-')}>{user.name}</div>);
                respondedUsers.push(<div className={styles.itemR} key={_.uniqueId('stats-')}>{obj.key}</div>);
              }
            });
          }
        });
      }
    }

    return respondedUsers;
  }

  getUnresponsive() {
    const { currentPoll, getUser } = this.props;

    if (!currentPoll) return null;

    const {
      users,
    } = currentPoll;

    const usersToRespond = [];

    const usersList = _.compact(users);

    if (usersList) {
      usersList.map((userId) => {
        const user = getUser(userId);

        if (user) {
          usersToRespond.push(<div className={styles.item} key={_.uniqueId('stats-')}>{user.name}</div>);
          usersToRespond.push(<div className={styles.itemR} key={_.uniqueId('stats-')}>^</div>);
        }
      });
    }

    return usersToRespond;
  }

  render() {
    const { intl } = this.props;

    return (
      <div>
        <div className={styles.stats}>
          {this.getPollStats()}
        </div>
        <div className={styles.container}>
          <div className={styles.usersHeading}>{intl.formatMessage(intlMessages.usersTitle)}</div>
          <div className={styles.responseHeading}>{intl.formatMessage(intlMessages.responsesTitle)}</div>
          {this.getRespondents()}
          {this.getUnresponsive()}
        </div>
      </div>
    );
  }
}

export default injectIntl(LiveResult);

LiveResult.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  getUser: PropTypes.func.isRequired,
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import WebcamDraggable from './webcam-draggable-overlay/component';

import { styles } from './styles';

const propTypes = {
  children: PropTypes.element.isRequired,
  usersVideo: PropTypes.arrayOf(Array),
  floatingOverlay: PropTypes.bool,
  hideOverlay: PropTypes.bool,
  swapLayout: PropTypes.bool,
  disableVideo: PropTypes.bool,
  userWasInWebcam: PropTypes.bool,
  audioModalIsOpen: PropTypes.bool,
  joinVideo: PropTypes.func,
};

const defaultProps = {
  usersVideo: [],
  floatingOverlay: false,
  hideOverlay: true,
  swapLayout: false,
  disableVideo: false,
  userWasInWebcam: false,
  audioModalIsOpen: false,
  joinVideo: null,
};


export default class Media extends Component {
  constructor(props) {
    super(props);
    this.refContainer = React.createRef();
  }

  componentWillUpdate() {
    window.dispatchEvent(new Event('resize'));
  }

  componentDidUpdate(prevProps) {
    const {
      userWasInWebcam,
      audioModalIsOpen,
      joinVideo,
    } = this.props;

    const {
      audioModalIsOpen: oldAudioModalIsOpen,
    } = prevProps;

    if ((!audioModalIsOpen && oldAudioModalIsOpen) && userWasInWebcam) {
      Session.set('userWasInWebcam', false);
      joinVideo();
    }
  }

  render() {
    const {
      swapLayout,
      floatingOverlay,
      hideOverlay,
      disableVideo,
      children,
      audioModalIsOpen,
      usersVideo,
      isFullscreen,
    } = this.props;

    const contentClassName = cx({
      [styles.content]: true,
    });

    const overlayClassName = cx({
      [styles.overlay]: true,
      [styles.hideOverlay]: hideOverlay,
      [styles.floatingOverlay]: floatingOverlay,
    });

    return (
      <div
        id="container"
        className={cx(styles.container)}
        ref={this.refContainer}
      >
        <div
          className={!swapLayout ? contentClassName : overlayClassName}
          style={{
            maxHeight: usersVideo.length < 1 || floatingOverlay ? '100%' : '80%',
          }}
        >
          {children}
        </div>
        <WebcamDraggable
          refMediaContainer={this.refContainer}
          swapLayout={swapLayout}
          singleWebcam={floatingOverlay}
          usersVideoLenght={usersVideo.length}
          hideOverlay={hideOverlay}
          disableVideo={disableVideo}
          audioModalIsOpen={audioModalIsOpen}
          usersVideo={usersVideo}
          isFullscreen={isFullscreen}
        />
      </div>
    );
  }
}

Media.propTypes = propTypes;
Media.defaultProps = defaultProps;

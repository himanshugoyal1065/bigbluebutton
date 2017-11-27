import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import Dropzone from 'react-dropzone';
import update from 'immutability-helper';
import cx from 'classnames';
import _ from 'lodash';

import ModalFullscreen from '/imports/ui/components/modal/fullscreen/component';
import Icon from '/imports/ui/components/icon/component';
import ButtonBase from '/imports/ui/components/button/base/component';
import Checkbox from '/imports/ui/components/checkbox/component';
import styles from './styles.scss';

const propTypes = {
  intl: intlShape.isRequired,
  defaultFileName: PropTypes.string.isRequired,
  fileSizeMin: PropTypes.number.isRequired,
  fileSizeMax: PropTypes.number.isRequired,
  handleSave: PropTypes.func.isRequired,
  fileValidMimeTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  presentations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    isCurrent: PropTypes.bool.isRequired,
    conversion: PropTypes.object,
    upload: PropTypes.object,
  })).isRequired,
};

const defaultProps = {
};

const intlMessages = defineMessages({
  title: {
    id: 'app.presentationUploder.title',
    description: 'title of the modal',
  },
  message: {
    id: 'app.presentationUploder.message',
    description: 'message warning the types of files accepted',
  },
  confirmLabel: {
    id: 'app.presentationUploder.confirmLabel',
    description: 'used in the button that start the upload of the new presentation',
  },
  confirmDesc: {
    id: 'app.presentationUploder.confirmDesc',
    description: 'description of the confirm',
  },
  dismissLabel: {
    id: 'app.presentationUploder.dismissLabel',
    description: 'used in the button that close modal',
  },
  dismissDesc: {
    id: 'app.presentationUploder.dismissDesc',
    description: 'description of the dismiss',
  },
  dropzoneLabel: {
    id: 'app.presentationUploder.dropzoneLabel',
    description: 'message warning where drop files for upload',
  },
  browseFilesLabel: {
    id: 'app.presentationUploder.browseFilesLabel',
    description: 'message use on the file browser',
  },
  fileToUpload: {
    id: 'app.presentationUploder.fileToUpload',
    description: 'message used in the file selected for upload',
  },
  genericError: {
    id: 'app.presentationUploder.genericError',
    description: 'generic error while uploading/converting',
  },
  uploadProcess: {
    id: 'app.presentationUploder.upload.progress',
    description: 'message that indicates the percentage of the upload',
  },
  413: {
    id: 'app.presentationUploder.upload.413',
    description: 'error that file exceed the size limit',
  },
  conversionProcessingSlides: {
    id: 'app.presentationUploder.conversion.conversionProcessingSlides',
    description: 'indicates how many slides were converted',
  },
  genericConversionStatus: {
    id: 'app.presentationUploder.conversion.genericConversionStatus',
    description: 'indicates that file is being converted',
  },
  TIMEOUT: {
    id: 'app.presentationUploder.conversion.timeout',
  },
  GENERATING_THUMBNAIL: {
    id: 'app.presentationUploder.conversion.generatingThumbnail',
    description: 'indicatess that it is generating thumbnails',
  },
  GENERATING_SVGIMAGES: {
    id: 'app.presentationUploder.conversion.generatingSvg',
    description: 'warns that it is generating svg images',
  },
  GENERATED_SLIDE: {
    id: 'app.presentationUploder.conversion.generatedSlides',
    description: 'warns that were slides generated',
  },
});

class PresentationUploader extends Component {
  constructor(props) {
    super(props);

    const currentPres = props.presentations.find(p => p.isCurrent);

    this.state = {
      presentations: props.presentations,
      oldCurrentId: currentPres ? currentPres.id : -1,
      preventClosing: false,
      disableActions: false,
    };

    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleDismiss = this.handleDismiss.bind(this);
    this.handleFiledrop = this.handleFiledrop.bind(this);
    this.handleCurrentChange = this.handleCurrentChange.bind(this);
    this.handleRemove = this.handleRemove.bind(this);

    this.updateFileKey = this.updateFileKey.bind(this);
    this.deepMergeUpdateFileKey = this.deepMergeUpdateFileKey.bind(this);
  }

  updateFileKey(id, key, value, operation = '$set') {
    this.setState(({ presentations }) => {
      const fileIndex = presentations.findIndex(f => f.id === id);

      return fileIndex === -1 ? false : {
        presentations: update(presentations, {
          [fileIndex]: {
            $apply: file =>
              update(file, {
                [key]: {
                  [operation]: value,
                },
              }),
          },
        }),
      };
    });
  }

  deepMergeUpdateFileKey(id, key, value) {
    const applyValue = toUpdate => update(toUpdate, { $merge: value });
    this.updateFileKey(id, key, applyValue, '$apply');
  }

  handleConfirm() {
    const presentationsToSave = this.state.presentations
      .filter(p => !p.upload.error && !p.conversion.error);

    this.setState({
      disableActions: true,
      preventClosing: true,
      presentations: presentationsToSave,
    });

    return this.props.handleSave(presentationsToSave)
      .then(() => {
        const { presentations, oldCurrentId } = this.state;

        const hasError = presentations.some(p => p.upload.error || p.conversion.error);

        if (!hasError) {
          this.setState({
            disableActions: false,
            preventClosing: false,
          });

          return;
        }

        // if theres error we dont want to close the modal
        this.setState({
          disableActions: false,
          preventClosing: true,
        }, () => {
          // if the selected current has error we revert back to the old one
          const newCurrent = presentations.find(p => p.isCurrent);
          if (newCurrent.upload.error || newCurrent.conversion.error) {
            this.handleCurrentChange(oldCurrentId);
          }
        });
      })
      .catch((error) => {
        console.error(error);

        this.setState({
          disableActions: false,
          preventClosing: true,
        });
      });
  }

  handleDismiss() {
    return new Promise((resolve) => {
      this.setState({
        preventClosing: false,
        disableActions: false,
      }, resolve);
    });
  }

  handleFiledrop(files) {
    const presentationsToUpload = files.map((file) => {
      const id = _.uniqueId(file.name);

      return {
        file,
        id,
        filename: file.name,
        isCurrent: false,
        conversion: { done: false, error: false },
        upload: { done: false, error: false, progress: 0 },
        onProgress: (event) => {
          if (!event.lengthComputable) {
            this.deepMergeUpdateFileKey(id, 'upload', {
              progress: 100,
              done: true,
            });

            return;
          }

          this.deepMergeUpdateFileKey(id, 'upload', {
            progress: (event.loaded / event.total) * 100,
            done: event.loaded === event.total,
          });
        },
        onConversion: (conversion) => {
          this.deepMergeUpdateFileKey(id, 'conversion', conversion);
        },
        onUpload: (upload) => {
          this.deepMergeUpdateFileKey(id, 'upload', upload);
        },
        onDone: (newId) => {
          this.updateFileKey(id, 'id', newId);
        },
      };
    });

    this.setState(({ presentations }) => ({
      presentations: presentations.concat(presentationsToUpload),
    }));
  }

  handleCurrentChange(id) {
    const { presentations, disableActions } = this.state;
    if (disableActions) return;

    const currentIndex = presentations.findIndex(p => p.isCurrent);
    const newCurrentIndex = presentations.findIndex(p => p.id === id);

    const commands = {};

    // we can end up without a current presentation
    if (currentIndex !== -1) {
      commands[currentIndex] = {
        $apply: (presentation) => {
          const p = presentation;
          p.isCurrent = false;
          return p;
        },
      };
    }

    commands[newCurrentIndex] = {
      $apply: (presentation) => {
        const p = presentation;
        p.isCurrent = true;
        return p;
      },
    };

    const presentationsUpdated = update(presentations, commands);

    this.setState({
      presentations: presentationsUpdated,
    });
  }

  handleRemove(item) {
    const { presentations, disableActions } = this.state;
    if (disableActions) return;

    const toRemoveIndex = presentations.indexOf(item);
    const toRemove = presentations[toRemoveIndex];


    if (toRemove.isCurrent) {
      const defaultPresentation =
        presentations.find(presentation => presentation.filename === this.props.defaultFileName);
      this.handleCurrentChange(defaultPresentation.id);
    }

    this.setState({
      presentations: update(presentations, {
        $splice: [[toRemoveIndex, 1]],
      }),
    });
  }

  renderPresentationList() {
    const { presentations } = this.state;

    const presentationsSorted = presentations
      .sort((a, b) => b.filename === this.props.defaultFileName);

    return (
      <div className={styles.fileList}>
        <table className={styles.table}>
          <tbody>
            { presentationsSorted.map(item => this.renderPresentationItem(item))}
          </tbody>
        </table>
      </div>
    );
  }

  renderPresentationItemStatus(item) {
    const { intl } = this.props;

    if (!item.upload.done && item.upload.progress === 0) {
      return intl.formatMessage(intlMessages.fileToUpload);
    }

    if (!item.upload.done && !item.upload.error) {
      return intl.formatMessage(intlMessages.uploadProcess, {
        progress: Math.floor(item.upload.progress).toString(),
      });
    }

    if (item.upload.done && item.upload.error) {
      const errorMessage = intlMessages[item.upload.status] || intlMessages.genericError;
      return intl.formatMessage(errorMessage);
    }

    if (!item.conversion.done && item.conversion.error) {
      const errorMessage = intlMessages[item.conversion.status] || intlMessages.genericError;
      return intl.formatMessage(errorMessage);
    }

    if (!item.conversion.done && !item.conversion.error) {
      if (item.conversion.pagesCompleted < item.conversion.numPages) {
        return intl.formatMessage(intlMessages.conversionProcessingSlides, {
          current: item.conversion.pagesCompleted,
          total: item.conversion.numPages,
        });
      }

      const conversionStatusMessage =
        intlMessages[item.conversion.status] || intlMessages.genericConversionStatus;
      return intl.formatMessage(conversionStatusMessage);
    }

    return null;
  }

  renderPresentationItem(item) {
    const { disableActions } = this.state;

    const isProcessing = (!item.conversion.done && item.upload.done) ||
    (!item.upload.done && item.upload.progress > 0);
    const itemClassName = {};

    itemClassName[styles.tableItemNew] = item.id === item.filename;
    itemClassName[styles.tableItemUploading] = !item.upload.done;
    itemClassName[styles.tableItemConverting] = !item.conversion.done && item.upload.done;
    itemClassName[styles.tableItemError] = item.conversion.error || item.upload.error;
    itemClassName[styles.tableItemAnimated] = isProcessing;

    const hideRemove = isProcessing || item.filename === this.props.defaultFileName;
    const hideCurrent = item.upload.error || item.conversion.error;

    return (
      <tr
        key={item.id}
        className={cx(itemClassName)}
      >
        <td className={styles.tableItemIcon}>
          <Icon iconName="file" />
        </td>
        <th className={styles.tableItemName}>
          <span>{item.filename}</span>
        </th>
        <td className={styles.tableItemStatus}>
          {this.renderPresentationItemStatus(item)}
        </td>
        <td className={styles.tableItemActions}>
          { hideCurrent ? null : (
            <Checkbox
              disabled={disableActions}
              ariaLabel="Set as current presentation"
              className={styles.itemAction}
              checked={item.isCurrent}
              onChange={() => this.handleCurrentChange(item.id)}
            />
          )}
          { hideRemove ? null : (
            <ButtonBase
              disabled={disableActions}
              className={cx(styles.itemAction, styles.itemActionRemove)}
              label="Remove presentation"
              onClick={() => this.handleRemove(item)}
            >
              <Icon iconName="delete" />
            </ButtonBase>
          )}
        </td>
      </tr>
    );
  }

  renderDropzone() {
    const {
      intl,
      fileSizeMin,
      fileSizeMax,
      fileValidMimeTypes,
    } = this.props;

    const { disableActions } = this.state;

    if (disableActions) return null;

    return (
      <Dropzone
        multiple
        className={styles.dropzone}
        activeClassName={styles.dropzoneActive}
        rejectClassName={styles.dropzoneReject}
        accept={fileValidMimeTypes.join()}
        minSize={fileSizeMin}
        maxSize={fileSizeMax}
        disablePreview
        onDrop={this.handleFiledrop}
      >
        <Icon className={styles.dropzoneIcon} iconName="upload" />
        <p className={styles.dropzoneMessage}>
          {intl.formatMessage(intlMessages.dropzoneLabel)}&nbsp;
          <span className={styles.dropzoneLink}>
            {intl.formatMessage(intlMessages.browseFilesLabel)}
          </span>
        </p>
      </Dropzone>
    );
  }

  render() {
    const { intl } = this.props;
    const { preventClosing, disableActions } = this.state;

    return (
      <ModalFullscreen
        title={intl.formatMessage(intlMessages.title)}
        preventClosing={preventClosing}
        confirm={{
          callback: this.handleConfirm,
          label: intl.formatMessage(intlMessages.confirmLabel),
          description: intl.formatMessage(intlMessages.confirmDesc),
          disabled: disableActions,
        }}
        dismiss={{
          callback: this.handleDismiss,
          label: intl.formatMessage(intlMessages.dismissLabel),
          description: intl.formatMessage(intlMessages.dismissDesc),
          disabled: disableActions,
        }}
      >
        <p>{intl.formatMessage(intlMessages.message)}</p>
        {this.renderPresentationList()}
        {this.renderDropzone()}
      </ModalFullscreen>
    );
  }
}

PresentationUploader.propTypes = propTypes;
PresentationUploader.defaultProps = defaultProps;

export default injectIntl(PresentationUploader);

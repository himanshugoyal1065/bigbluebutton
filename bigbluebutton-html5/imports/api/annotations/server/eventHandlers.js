import RedisPubSub from '/imports/startup/server/redis';
import { skipFlashDirectEvent } from '/imports/api/common/server/helpers';
import handleWhiteboardCleared from './handlers/whiteboardCleared';
import handleWhiteboardUndo from './handlers/whiteboardUndo';
import handleWhiteboardSend from './handlers/whiteboardSend';
import handleWhiteboardAnnotations from './handlers/whiteboardAnnotations';

RedisPubSub.on('ClearWhiteboardEvtMsg', handleWhiteboardCleared);
RedisPubSub.on('UndoWhiteboardEvtMsg', handleWhiteboardUndo);
RedisPubSub.on('SendWhiteboardAnnotationEvtMsg', handleWhiteboardSend);
RedisPubSub.on('GetWhiteboardAnnotationsRespMsg', skipFlashDirectEvent(handleWhiteboardAnnotations));

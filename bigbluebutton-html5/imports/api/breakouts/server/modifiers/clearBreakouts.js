import Logger from '/imports/startup/server/logger';
import Breakouts from '/imports/api/breakouts';

export default function clearBreakouts(breakoutId) {
  if (breakoutId) {
    const selector = {
      breakoutId,
    };

    return Breakouts.remove(selector, () => {
      Logger.info(`Cleared Breakouts (${breakoutId})`);
    });
  }

  return Breakouts.remove({}, () => {
    Logger.info('Cleared Breakouts (all)');
  });
}

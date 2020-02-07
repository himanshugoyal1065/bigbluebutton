const Page = require('./core/page');
const Status = require('./user/status');
const MultiUsers = require('./user/multiusers');

describe('User', () => {
  test('Change status', async () => {
    const test = new Status();
    let response;
    try {
      await test.init(Page.getArgs());
      response = await test.test();
    } catch (e) {
      console.log(e);
    } finally {
      await test.close();
    }
    expect(response).toBe(true);
  }, 30000);

  test('Check presence', async () => {
    const test = new MultiUsers();
    let response;
    try {
      await test.init(Page.getArgs());
      await test.joinExtraUser();
      response = await test.test();
    } catch (err) {
      console.log(err);
    } finally {
      await test.close();
    }
    expect(response).toBe(true);
  }, 30000);
});

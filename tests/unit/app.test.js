describe('app utilities (unit)', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  test('getMongoUri uses MONGODB_URI override', () => {
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://example/override' };

    jest.isolateModules(() => {
      const { getMongoUri } = require('../../src/app');
      expect(getMongoUri()).toBe('mongodb://example/override');
    });
  });

  test('getMongoUri uses production URI when NODE_ENV=production', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };

    jest.isolateModules(() => {
      const { getMongoUri } = require('../../src/app');
      expect(getMongoUri()).toBe(
        'mongodb://workboard-prod-mongo:27017/Workboard',
      );
    });
  });

  test('getMongoUri uses dev URI by default', () => {
    process.env = { ...originalEnv };
    delete process.env.MONGODB_URI;
    delete process.env.NODE_ENV;

    jest.isolateModules(() => {
      const { getMongoUri } = require('../../src/app');
      expect(getMongoUri()).toBe(
        'mongodb://workboard-dev-mongo:27017/Workboard',
      );
    });
  });

  test('start connects to MongoDB and starts listening', async () => {
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://example/test' };

    let start;
    let app;
    let sandboxMongoose;
    jest.isolateModules(() => {
      ({ start, app } = require('../../src/app'));
      sandboxMongoose = require('mongoose');
    });

    const connectSpy = jest
      .spyOn(sandboxMongoose, 'connect')
      .mockResolvedValueOnce(undefined);
    const listenSpy = jest
      .spyOn(app, 'listen')
      .mockImplementationOnce((_port, cb) => {
        if (cb) cb();
        return { close: jest.fn() };
      });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await start();

    expect(connectSpy).toHaveBeenCalledWith('mongodb://example/test');
    expect(listenSpy).toHaveBeenCalled();

    connectSpy.mockRestore();
    listenSpy.mockRestore();
    logSpy.mockRestore();
  });
});

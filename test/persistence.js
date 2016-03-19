/* global describe, it */

'use strict'

var testPersistence = function (persistenceType) {
  var Persistence = require('../src/persistence/' + persistenceType)
  var uuid = require('node-uuid')
  var should = require('should')
  var assert = require('assert')

  describe('persistence: ' + persistenceType + ': createApp', function () {
    it('should create an app', function (done) {
      var oldApp = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.createApp(oldApp, function (err) {
        should.not.exist(err)
        persistence.retrieveApp(oldApp.id, function (err, newApp) {
          should.not.exist(err)
          should.exist(newApp)
          done()
        })
      })
    })

    it('should return error if the app already exists', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.createApp(app, function (err) {
          should.exist(err)
          // TODO: properties of err
          done()
        })
      })
    })
  })

  describe('persistence: ' + persistenceType + ': listApps', function () {
    it('should list apps', function (done) {
      var oldApp1 = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }
      var oldApp2 = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.createApp(oldApp1, function (err) {
        should.not.exist(err)
        persistence.createApp(oldApp2, function (err) {
          should.not.exist(err)
          persistence.listApps(function (err, apps) {
            should.not.exist(err)
            apps.should.be.instanceof(Array).and.not.be.empty()
            apps.length.should.be.aboveOrEqual(2)
            assert.deepEqual(oldApp2, apps[0])
            assert.deepEqual(oldApp1, apps[1])
            done()
          })
        })
      })
    })
  })

  describe('persistence: ' + persistenceType + ': retrieveApp', function () {
    it('should retrieve an app', function (done) {
      var appId = uuid.v4()
      var oldApp = {
        id: appId,
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.createApp(oldApp, function (err) {
        should.not.exist(err)
        persistence.retrieveApp(appId, function (err, newApp) {
          should.not.exist(err)
          assert.deepEqual(oldApp, newApp)
          done()
        })
      })
    })

    it('should return error if the app does not exist', function (done) {
      var appId = uuid.v4()

      var persistence = new Persistence()

      persistence.retrieveApp(appId, function (err, app) {
        should.exist(err)
        // TODO: properties of err
        done()
      })
    })
  })

  describe('persistence: ' + persistenceType + ': deleteApp', function () {
    it('should delete an app', function (done) {
      var appId = uuid.v4()
      var app = {
        id: appId,
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.retrieveApp(appId, function (err, app) {
          should.not.exist(err)
          should.exist(app)
          persistence.deleteApp(appId, function (err) {
            should.not.exist(err)
            persistence.retrieveApp(appId, function (err, app) {
              should.exist(err)
              done()
            })
          })
        })
      })
    })

    it('should return error if the app does not exist', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.deleteApp(app.id, function (err) {
        should.exist(err)
        // TODO: properties of err
        done()
      })
    })

    it('should return error if the app is deleted twice', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }

      var persistence = new Persistence()

      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.deleteApp(app.id, function (err) {
          should.not.exist(err)
          persistence.deleteApp(app.id, function (err) {
            should.exist(err)
            // TODO: properties of err
            done()
          })
        })
      })
    })
  })

  describe('persistence: ' + persistenceType + ': createHandler', function () {
    it('should create a handler', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }
      var handler = {
        id: uuid.v4()
      }

      var persistence = new Persistence()

      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.createHandler(app.id, handler, function (err) {
          should.not.exist(err)
          persistence.retrieveHandler(app.id, handler.id, function (err, handler) {
            should.not.exist(err)
            should.exist(handler)
            done()
          })
        })
      })
    })

    it('should return error if the app does not exist', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }
      var handler = {id: uuid.v4()}

      var persistence = new Persistence()

      persistence.createHandler(app.id, handler, function (err) {
        should.exist(err)
        // TODO: properties of err
        done()
      })
    })

    it('should return error if the handler already exists', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }
      var handler = {
        id: uuid.v4()
      }

      var persistence = new Persistence()
      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.createHandler(app.id, handler, function (err) {
          should.not.exist(err)
          persistence.createHandler(app.id, handler, function (err) {
            should.exist(err)
            // TODO: properties of err
            done()
          })
        })
      })
    })
  })

  describe('persistence: ' + persistenceType + ': retrieveHandler', function () {
    it('should retrieve a handler', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }
      var handlerId = uuid.v4()
      var oldHandler = {id: handlerId}

      var persistence = new Persistence()

      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.createHandler(app.id, oldHandler, function (err) {
          should.not.exist(err)
          persistence.retrieveHandler(app.id, handlerId, function (err, newHandler) {
            should.not.exist(err)
            assert.deepEqual(oldHandler, newHandler)
            done()
          })
        })
      })
    })

    it('should return error if the app does not exist', function (done) {
      var appId = uuid.v4()
      var handlerId = uuid.v4()

      var persistence = new Persistence()

      persistence.retrieveHandler(appId, handlerId, function (err, handler) {
        should.exist(err)
        // TODO: properties of err
        done()
      })
    })

    it('should return error if the handler does not exist', function (done) {
      var app = {
        id: uuid.v4(),
        created: new Date().toISOString()
      }
      var handlerId = uuid.v4()

      var persistence = new Persistence()

      persistence.createApp(app, function (err) {
        should.not.exist(err)
        persistence.retrieveHandler(app.id, handlerId, function (err, handler) {
          should.exist(err)
          // TODO: properties of err
          done()
        })
      })
    })
  })

  // TODO: tests for logs

  // TODO: we also need an operation to list handlers for an app, so we can .each() them on request
}

testPersistence('memory')
// NOTE: The tests should pass for any other persistence type we support.

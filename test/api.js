/* global describe, it */

'use strict'

var unirest = require('unirest')
var samples = require('../samples')

var options = {
  http: true,
  httpPort: 9300,
  username: 'test-username',
  password: 'test-password'
}

var Persistence = require('../src/persistence/memory')
var persistence = new Persistence(options)

var Api = require('../src/api')
var api = new Api(options, persistence)
api.start()

var baseUrl = 'http://localhost:' + options.httpPort

var makeRequest = function (app, request, callback) {
  var req = unirest(request.method, baseUrl + app.url + '/test' + request.url)
  req.type('json')
  if (request.body) {
    req.send(request.body)
  }
  req.end(callback)
}

var createApp = function (app, callback) {
  var req = unirest.post(baseUrl + '/apps')
  req.auth(options.username, options.password, true)
  req.type('json')
  req.send(app)
  req.end(function (res) {
    res.status.should.equal(201)
    res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
    res.body.should.have.property('id')
    res.body.should.have.property('url')
    res.body.should.have.property('created')
    res.headers.should.have.property('location').and.equal(res.body.url)
    var appUrl = res.body.url
    var appId = res.body.id

    req = unirest.get(baseUrl + appUrl)
    req.auth(options.username, options.password, true)
    req.end(function (res) {
      res.status.should.equal(200)
      res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
      res.body.should.have.property('id').and.equal(appId)
      res.body.should.have.property('url').and.equal(appUrl)
      res.body.should.have.property('created').and.not.be.empty() // FIXME: be a valid date pretty close to now

      callback(res.body)
    })
  })
}

var assertAppEquality = function (expected, actual) {
  actual.should.have.property('id').and.equal(expected.id)
  actual.should.have.property('url').and.equal(expected.url)
  actual.should.have.property('created').and.equal(expected.created)
}

describe('api: GET /options', function () {
  it('should require authentication', function (done) {
    var req = unirest.get(baseUrl + '/options')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should return the options the API was started with', function (done) {
    var req = unirest.get(baseUrl + '/options')
    req.auth(options.username, options.password, true)
    req.end(function (res) {
      res.status.should.equal(200)
      res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
      res.body.should.eql(options)
      done()
    })
  })
})

describe('api: POST /apps', function () {
  it('should require authentication', function (done) {
    var req = unirest.post(baseUrl + '/apps')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should create an app (handlers array)', function (done) {
    createApp(samples.matchEverything, function (app) {
      var req = unirest.get(baseUrl + app.url)
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(200)
        res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
        res.body.should.have.property('id').and.equal(app.id)
        res.body.should.have.property('url').and.equal(app.url)
        res.body.should.have.property('created').and.equal(app.created)
        done()
      })
    })
  })

  it('should create an app (handlers object)', function (done) {
    createApp(samples.matchEverythingHandlersObject, function (app) {
      var req = unirest.get(baseUrl + app.url)
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(200)
        res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
        res.body.should.have.property('id').and.equal(app.id)
        res.body.should.have.property('url').and.equal(app.url)
        res.body.should.have.property('created').and.equal(app.created)
        done()
      })
    })
  })

  it('should create an app with empty logs', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      var req = unirest.get(baseUrl + app.url + '/logs')
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(200)
        res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
        res.body.should.have.keys('items')
        res.body.items.should.be.instanceof(Array).and.be.empty()
        done()
      })
    })
  })

  // TODO: validation
})

describe('api: GET /apps', function () {
  it('should require authentication', function (done) {
    var req = unirest.get(baseUrl + '/apps')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should retrieve apps', function (done) {
    createApp(samples.multipleHandlers, function (app1) {
      createApp(samples.multipleHandlers, function (app2) {
        var req = unirest.get(baseUrl + '/apps')
        req.auth(options.username, options.password, true)
        req.end(function (res) {
          res.status.should.equal(200)
          res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
          res.body.should.be.instanceof(Array).and.not.be.empty()
          res.body.length.should.be.aboveOrEqual(2)
          assertAppEquality(app2, res.body[0])
          assertAppEquality(app1, res.body[1])
          done()
        })
      })
    })
  })
})

describe('api: GET /apps/:app_id', function () {
  it('should require authentication', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should retrieve an app', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      var req = unirest.get(baseUrl + app.url)
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(200)
        res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
        assertAppEquality(app, res.body)
        done()
      })
    })
  })

  it('should return 404 if the app does not exist', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016')
    req.auth(options.username, options.password, true)
    req.end(function (res) {
      res.status.should.equal(404)
      done()
    })
  })
})

describe('api: DELETE /apps/:app_id', function () {
  it('should require authentication', function (done) {
    var req = unirest.delete(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should delete an app', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      var req = unirest.delete(baseUrl + app.url)
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(204)
        var req = unirest.get(baseUrl + app.url)
        req.auth(options.username, options.password, true)
        req.end(function (res) {
          res.status.should.equal(404)
          done()
        })
      })
    })
  })

  it('should return 404 if the app does not exist', function (done) {
    var req = unirest.delete(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016')
    req.auth(options.username, options.password, true)
    req.end(function (res) {
      res.status.should.equal(404)
      done()
    })
  })

  it('should return 404 if the app is deleted twice', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      var req = unirest.delete(baseUrl + app.url)
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(204)
        var req = unirest.delete(baseUrl + app.url)
        req.auth(options.username, options.password, true)
        req.end(function (res) {
          res.status.should.equal(404)
          done()
        })
      })
    })
  })
})

describe('api: GET /apps/:app_id/logs', function () {
  it('should require authentication', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016/logs')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should return empty array if the log is empty', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      var req = unirest.get(baseUrl + app.url + '/logs')
      req.auth(options.username, options.password, true)
      req.end(function (res) {
        res.status.should.equal(200)
        res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
        res.body.should.have.keys('items')
        res.body.items.should.be.instanceof(Array).and.be.empty()
        done()
      })
    })
  })

  it('should return the log entries', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      makeRequest(app, {method: 'POST', url: '/users', body: {username: 'colincoller'}}, function (res1) {
        res1.status.should.equal(201)
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          res2.status.should.equal(200)
          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)
            // TODO: ensure the log entries are valid
            done()
          })
        })
      })
    })
  })

  it('should return 404 if the app does not exist', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016/logs')
    req.auth(options.username, options.password, true)
    req.end(function (res) {
      res.status.should.equal(404)
      done()
    })
  })
})

describe('api: * /apps/:app_id/test/*', function () {
  it('should not require authentication', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016/test/this/is/dynamic')
    req.end(function (res) {
      res.status.should.not.equal(401)
      done()
    })
  })

  it('should return 404 if the app does not exist', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016/test/this/is/dynamic')
    req.end(function (res) {
      res.status.should.equal(404)
      done()
    })
  })

  it('should be able to match everything (handlers array)', function (done) {
    createApp(samples.matchEverything, function (app) {
      makeRequest(app, {method: 'POST', url: '/users', body: {username: 'colincoller'}}, function (res1) {
        res1.status.should.equal(200)
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          res2.status.should.equal(200)
          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)
            // TODO: ensure the log entries are valid
            done()
          })
        })
      })
    })
  })

  it('should be able to match everything (handlers object)', function (done) {
    createApp(samples.matchEverythingHandlersObject, function (app) {
      makeRequest(app, {method: 'POST', url: '/users', body: {username: 'colincoller'}}, function (res1) {
        res1.status.should.equal(200)
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          res2.status.should.equal(200)
          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)
            // TODO: ensure the log entries are valid
            done()
          })
        })
      })
    })
  })

  it('should honor maxMatches (handlers array)', function (done) {
    createApp(samples.errorRetries, function (app) {
      makeRequest(app, {method: 'GET', url: '/users/123'}, function (res1) {
        res1.status.should.equal(500)
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          res2.status.should.equal(200)
          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)

            // Both requests should have matched on-get-user-1, but it has maxMatches = 1, so the
            // first request matched on-get-user-1 and the second request matched on-get-user-2.
            res.body.items[0].handler.should.equal('on-get-user-1')
            res.body.items[1].handler.should.equal('on-get-user-2')

            done()
          })
        })
      })
    })
  })

  it('should honor maxMatches (handlers object)', function (done) {
    createApp(samples.errorRetriesHandlersObject, function (app) {
      makeRequest(app, {method: 'GET', url: '/users/123'}, function (res1) {
        res1.status.should.equal(500)
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          res2.status.should.equal(200)
          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)

            // Both requests should have matched on-get-user-1, but it has maxMatches = 1, so the
            // first request matched on-get-user-1 and the second request matched on-get-user-2.
            res.body.items[0].handler.should.equal('on-get-user-1')
            res.body.items[1].handler.should.equal('on-get-user-2')

            done()
          })
        })
      })
    })
  })

  it('should honor delay', function (done) {
    this.timeout(5000)
    createApp(samples.timeoutRetries, function (app) {
      var t = process.hrtime()
      makeRequest(app, {method: 'GET', url: '/users/123'}, function (res1) {
        t = process.hrtime(t)

        res1.status.should.equal(200)
        t[0].should.equal(3) // 3 seconds

        t = process.hrtime()
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          t = process.hrtime(t)

          res2.status.should.equal(200)
          t[0].should.equal(0) // 0 seconds

          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)

            // Both requests should have matched on-get-user-1, but it has maxMatches = 1, so the
            // first request matched on-get-user-1 which has the delay and the second request
            // matched on-get-user-2 which doesn't.
            res.body.items[0].handler.should.equal('on-get-user-1')
            res.body.items[1].handler.should.equal('on-get-user-2')

            done()
          })
        })
      })
    })
  })
})
describe('api: DELETE /apps/:app_id/logs', function () {
  it('should require authentication', function (done) {
    var req = unirest.get(baseUrl + '/apps/7aad7049-f4d0-41ee-9a14-0a03b0b97016/logs')
    req.end(function (res) {
      res.status.should.equal(401)
      done()
    })
  })

  it('should delete log entries and get an empty array of log entries afterwards', function (done) {
    createApp(samples.multipleHandlers, function (app) {
      makeRequest(app, {method: 'POST', url: '/users', body: {username: 'robertomontebelli'}}, function (res1) {
        res1.status.should.equal(201)
        makeRequest(app, {method: 'GET', url: '/users/123'}, function (res2) {
          res2.status.should.equal(200)
          var req = unirest.get(baseUrl + app.url + '/logs')
          req.auth(options.username, options.password, true)
          req.end(function (res) {
            res.status.should.equal(200)
            res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
            res.body.should.have.keys('items')
            res.body.items.length.should.equal(2)
            var req = unirest.delete(baseUrl + app.url + '/logs')
            req.auth(options.username, options.password, true)
            req.end(function (res) {
              res.status.should.equal(204)
              var req = unirest.get(baseUrl + app.url + '/logs')
              req.auth(options.username, options.password, true)
              req.end(function (res) {
                res.headers.should.have.property('content-type').and.equal('application/json; charset=utf-8')
                res.body.should.have.keys('items')
                res.body.items.length.should.equal(0)
                done()
              })
            })
          })
        })
      })
    })
  })
})

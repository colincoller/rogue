'use strict'

var express = require('express')
var bodyParser = require('body-parser')
var compression = require('compression')
var methodOverride = require('method-override')
var Auth = require('./middleware/auth')
var morgan = require('morgan')
var http = require('http')
var fs = require('fs')
var https = require('https')
var routes = require('./routes')

module.exports = function (options, persistence) {
  return {

    options: options,
    persistence: persistence,

    start: function () {
      var app = express()

      app.set('json spaces', 2)
      app.enable('trust proxy')
      app.disable('etag')

      if (options.logFormat) {
        app.use(morgan(options.logFormat))
      }

      app.use(compression())

      app.use(methodOverride('__method'))
      app.use(methodOverride('X-HTTP-Method-Override'))

      app.use(bodyParser.json())

      var auth = new Auth(options)

      app.get('/options', auth, routes.options.retrieve(this))
      app.post('/apps', auth, routes.apps.create(this))
      app.get('/apps/:app_id', auth, routes.apps.retrieve(this))
      app.get('/apps/:app_id/logs', auth, routes.apps.logs.list(this))
      app.delete('/apps/:app_id', auth, routes.apps.delete(this))

      app.all('/apps/:app_id/test/*', routes.apps.test.invoke(this)) // doesn't require auth

      http.createServer(app).listen(options.httpPort)
      console.log('Listening for http requests on port %d', options.httpPort)

      if (options.https) {
        var httpsOptions = {
          key: fs.readFileSync(options.httpsKey),
          cert: fs.readFileSync(options.httpsCert)
        }
        https.createServer(httpsOptions, app).listen(options.httpsPort)
        console.log('Listening for https requests on port %d', options.httpsPort)
      }
    },

    sendNotFound: function (res, err) {
      res.status(404).json({
        'message': err.message
      })
    },

    sendServerError: function (res, err) {
      console.log('Error: ' + err.message)
      res.status(500).json({
        'message': err.message
      })
    },

    sendNoContent: function (res) {
      res.status(204).send()
    },

    sendCreated: function (res, url) {
      res.status(201).location(url).json(url)
    }
  }
}

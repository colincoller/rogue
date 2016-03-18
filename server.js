'use strict'

var dotenv = require('dotenv')
var pkg = require('./package')

dotenv.config({ silent: true })

var options = {
  persistence: process.env.ROGUE_PERSISTENCE || pkg.config.persistence,
  http: process.env.ROGUE_HTTP || pkg.config.http,
  httpPort: process.env.ROGUE_HTTP_PORT || process.env.PORT || pkg.config.httpPort,
  https: process.env.ROGUE_HTTPS || pkg.config.https,
  httpsPort: process.env.ROGUE_HTTPS_PORT || pkg.config.httpsPort,
  httpsKey: process.env.ROGUE_HTTPS_KEY || pkg.config.httpsKey,
  httpsCert: process.env.ROGUE_HTTPS_CERT || pkg.config.httpsCert,
  logFormat: process.env.ROGUE_LOG_FORMAT || pkg.config.logFormat
}

var Persistence = require('./src/persistence/' + options.persistence)
var persistence = new Persistence(options)

var Api = require('./src/api')
var api = new Api(options, persistence)

api.start()

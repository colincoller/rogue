var basicAuth = require('basic-auth')

module.exports = function (options) {
  return function (req, res, next) {
    if (!options.username) {
      return next()
    }

    var user = basicAuth(req)
    if (!user || !user.name || user.name !== options.username || !user.pass || user.pass !== options.password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.sendStatus(401)
    }

    return next()
  }
}

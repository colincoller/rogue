var uuid = require('node-uuid')
var async = require('async')

module.exports = function (api) {
  return function (req, res, next) {
    var app = req.body
    // TODO: validate app

    app.id = uuid.v4()
    app.created = new Date().toISOString()
    app.url = '/apps/' + app.id
    app.handlers = app.handlers || {}
    app.logs = []

    api.persistence.createApp(app, function (err) {
      if (err) {
        api.sendServerError(res, err)
      } else {
        async.each(Object.keys(app.handlers), function (handlerId, callback) {
          var handler = app.handlers[handlerId]

          handler.id = handlerId
          handler.request = handler.request || {}
          handler.response = handler.response || {}
          // TODO: validate handler

          api.persistence.createHandler(app.id, handler, callback)
        },
        function (err) {
          if (err) {
            api.sendServerError(res, err)
          } else {
            api.sendCreated(res, app.url)
          }
        })
      }
    })
  }
}

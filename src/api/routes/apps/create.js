var uuid = require('node-uuid')
var async = require('async')

var flattenHandlers = function (handlers) {
  if (!handlers) {
    return []
  }

  if (handlers instanceof Array) {
    return handlers
  }

  var handlersArray = []
  Object.keys(handlers).forEach(function (handlerId) {
    var handler = handlers[handlerId]
    handler.id = handlerId
    handlersArray.push(handler)
  })
  return handlersArray
}

module.exports = function (api) {
  return function (req, res, next) {
    var app = req.body
    // TODO: validate app

    app.id = uuid.v4()
    app.created = new Date().toISOString()
    app.url = '/apps/' + app.id
    app.handlers = flattenHandlers(app.handlers)
    app.logs = []

    api.persistence.createApp(app, function (err) {
      if (err) {
        api.sendServerError(res, err)
      } else {
        async.each(app.handlers, function (handler, callback) {
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

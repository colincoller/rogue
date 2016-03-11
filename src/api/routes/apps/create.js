var uuid = require('node-uuid')
var async = require('async')

module.exports = function (api) {
  return function (req, res, next) {
    var app = req.body
    // TODO: validate app

    // console.log(JSON.stringify(app, null, 2))

    app.handlers = app.handlers || {}
    app.id = uuid.v4()
    app.url = '/apps/' + app.id
    app.logs = []

    api.persistence.createApp(app, function (err) {
      if (err) {
        api.sendServerError(res, err)
      } else {
        async.each(Object.keys(app.handlers), function (handlerId, callback) {
          var handler = app.handlers[handlerId]

          handler.request = handler.request || {}
          handler.response = handler.response || {}
          // TODO: validate handler

          handler.id = handlerId
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

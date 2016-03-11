var async = require('async')
var UrlPattern = require('url-pattern')

module.exports = function (api) {
  return function (req, res, next) {
    api.persistence.retrieveApp(req.params.app_id, function (err, app) {
      if (err) {
        api.sendNotFound(res, err)
      } else {
        api.persistence.listHandlers(app.id, function (err, handlers) {
          if (err) {
            api.sendServerError(res, err)
          } else {
            var urlPrefix = '/apps/' + app.id + '/test'

            var handler = null
            var relativeUrl = null

            async.each(Object.keys(handlers), function (handlerId, callback) {
              if (handler) {
                callback(null)
                return
              }

              var candidateHandler = handlers[handlerId]
              var candidateMatches = {}

              if (
                (candidateHandler.totalMatches && candidateHandler.maxMatches && candidateHandler.totalMatches >= candidateHandler.maxMatches) ||
                (candidateHandler.request.protocol && req.protocol !== candidateHandler.request.protocol) ||
                (candidateHandler.request.method && req.method !== candidateHandler.request.method)
                ) {
                callback(null)
                return
              }

              if (candidateHandler.request.url) {
                relativeUrl = req.url.substring(urlPrefix.length)
                candidateMatches.url = new UrlPattern(candidateHandler.request.url).match(relativeUrl)
                if (!candidateMatches.url) {
                  callback(null)
                  return
                }
              }

              // TODO: other matching logic
              // TODO: - match on headers? e.g. content-type?
              // TODO: - match on url parameters?
              // TODO: - match on request body properties?

              handler = candidateHandler
              callback(null)
            },
            function (err) {
              if (err) {
                api.sendServerError(res, err)
              } else if (!handler) {
                api.sendServerError(res, new Error('No matching handler found.'))
              } else {
                var body = handler.response.body // TODO: construct body using candidateMatches

                var headers = handler.response.headers // TODO: construct headers using candidateMatches

                var log = {
                  date: new Date().toISOString(),
                  request: {
                    protocol: req.protocol,
                    method: req.method,
                    fullUrl: req.url,
                    relativeUrl: relativeUrl,
                    headers: req.headers,
                    body: req.body
                  },
                  handler: handler.id,
                  response: {
                    status: handler.response.status,
                    headers: headers,
                    body: body
                  }
                }
                api.persistence.createLog(app.id, handler.id, log, function (err) {
                  if (err) {
                    api.sendServerError(res, err)
                  } else {
                    var delay = handler.response.delay || 0
                    setTimeout(function () {
                      res.status(handler.response.status)
                      if (headers) {
                        Object.keys(headers).forEach(function (headerKey) {
                          var headerValue = headers[headerKey]
                          res.append(headerKey, headerValue)
                        })
                      }
                      if (body) {
                        res.json(body)
                      }
                      res.end()
                    }, delay)
                  }
                })
              }
            })
          }
        })
      }
    })
  }
}

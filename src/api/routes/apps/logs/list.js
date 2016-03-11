module.exports = function (api) {
  return function (req, res, next) {
    api.persistence.retrieveApp(req.params.app_id, function (err, app) {
      if (err) {
        api.sendNotFound(res, err)
      } else {
        api.persistence.listLogs(req.params.app_id, function (err, logs) {
          if (err) {
            api.sendServerError(res, err)
          } else {
            res.json(logs)
          }
        })
      }
    })
  }
}

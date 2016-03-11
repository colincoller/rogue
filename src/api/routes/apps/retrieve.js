module.exports = function (api) {
  return function (req, res, next) {
    api.persistence.retrieveApp(req.params.app_id, function (err, app) {
      if (err) {
        api.sendNotFound(res, err)
      } else {
        app.url = '/apps/' + app.id
        res.json(app)
      }
    })
  }
}

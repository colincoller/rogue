module.exports = function (api) {
  return function (req, res, next) {
    api.persistence.retrieveApp(req.params.app_id, function (err, app) {
      if (err) {
        api.sendNotFound(res, err)
      } else {
        res.json({
          id: app.id,
          url: '/apps/' + app.id,
          created: app.created
        })
      }
    })
  }
}

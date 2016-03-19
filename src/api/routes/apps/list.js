module.exports = function (api) {
  return function (req, res, next) {
    api.persistence.listApps(function (err, apps) {
      if (err) {
        console.log(err)
        api.sendServerError(res, err)
      } else {
        res.json(apps.map(function (app) {
          return {
            id: app.id,
            url: '/apps/' + app.id,
            created: app.created
          }
        }))
      }
    })
  }
}

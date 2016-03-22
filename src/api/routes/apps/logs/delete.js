module.exports = function (api) {
    return function (req, res, next) {
        api.persistence.retrieveApp(req.params.app_id, function (err, app) {
            if (err) {
                api.sendNotFound(res, err)
            } else {
                api.persistence.deleteLogs(app.id, function (err) {
                    if (err) {
                        api.sendServerError(res, err)
                    } else {
                        api.sendNoContent(res, err)
                    }
                })
            }
        })
    }
}
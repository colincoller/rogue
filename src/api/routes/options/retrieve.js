// GET /options
//
// Retrieves the options that Rogue was started with.

module.exports = function (api) {
  return function (req, res, next) {
    res.json(api.options)
  }
}

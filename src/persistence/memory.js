'use strict'

module.exports = function (options) {
  return {

    apps: {},

    // POST /apps
    createApp: function (app, callback) {
      if (this.apps[app.id]) {
        return callback(new Error('App ' + app.id + ' already exists.'))
      }
      this.apps[app.id] = {
        'id': app.id,
        'handlers': {},
        'logs': []
      }
      callback(null)
    },

    // GET /apps/:app_id
    retrieveApp: function (appId, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'), null)
      }
      callback(null, {
        'id': app.id
      })
    },

    // DELETE /apps/:app_id
    deleteApp: function (appId, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'))
      }
      delete this.apps[appId]
      callback(null)
    },

    // POST /apps/:app_id/handlers
    createHandler: function (appId, handler, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'))
      }
      if (app.handlers[handler.id]) {
        return callback(new Error('Handler ' + handler.id + ' aleady exists in app ' + app.id + '.'))
      }
      app.handlers[handler.id] = handler
      callback(null)
    },

    // This isn't exposed through the API.
    listHandlers: function (appId, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'), null)
      }
      callback(null, app.handlers)
    },

    // GET /apps/:app_id/handlers/:handler_id
    retrieveHandler: function (appId, handlerId, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'), null)
      }
      var handler = app.handlers[handlerId]
      if (!handler) {
        return callback(new Error('Handler ' + handlerId + ' does not exist in app' + app.id + '.'), null)
      }
      callback(null, handler)
    },

    // * /apps/:app_id/test/*
    createLog: function (appId, handlerId, log, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'), null)
      }
      var handler = app.handlers[handlerId]
      if (!handler) {
        return callback(new Error('Handler ' + handlerId + ' does not exist in app' + app.id + '.'), null)
      }
      app.logs.push(log)
      handler.totalMatches = (handler.totalMatches || 0) + 1
      callback(null)
    },

    // GET /apps/:app_id/logs
    listLogs: function (appId, callback) {
      var app = this.apps[appId]
      if (!app) {
        return callback(new Error('App ' + appId + ' does not exist.'), null)
      }
      callback(null, app.logs)
    }
  }
}

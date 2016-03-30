# Rogue

## Introduction

Rogue is a simple service for writing tests for webhooks and other outbound HTTP+JSON requests.

Rogue allows you to write tests that ensure
- your code makes HTTP+JSON requests to external services with the correct properties
- your code behaves correctly when external services return responses with particular sets of properties

Rogue provides a simple API that tests can call to
- create apps that can receive pre-defined HTTP+JSON requests, log the requests, and send pre-defined responses
- retrieve the logs from the apps

Before you use Rogue, you should consider using [Mockbin](https://github.com/Mashape/mockbin), a similar service written by [Mashape](https://github.com/Mashape).  Mockbin is the more mature service and may be the better choice depending on what you're testing and how you write your tests.

## Getting Started

### Installing

To install Rogue from source:

```
git clone git@github.com:uberflip/rogue-webhooks.git
cd rogue-webhooks
npm install
npm test
```

### Configuring

Rogue stores its configuration settings in `package.json`'s `config` property.

By default, Rogue is configured to listen for HTTP traffic on port 5000.  To change the HTTP port, edit `package.json` and set `httpPort` appropriately.

Other configuration settings are described below.  Most configuration is done through Rogue's API when the service is running.

### Running

```
npm start
```

## Usage

### Basics

Rogue lets your tests create *apps* made up of *handlers* that match *requests* and return *responses*.  For example, this is a simple app with a single handler that matches requests to `POST /users` and returns a `201 Created` response with a `Location` header and a JSON string body:

```
{
  "handlers": [
    {
      "id": "on-create-user",
      "request": {
        "method": "POST",
        "url": "/users"
      },
      "response": {
        "status": 201,
        "headers": {
          "Location": "/users/123"
        },
        "body": "/users/123"
      }
    }
  ]
}
```

Your test can create an app with `POST /apps`:

```
curl -X POST http://localhost:8080/apps -d @samples/matchEverything.json

"/apps/40f7f6db-7e19-451f-8cd9-a6376cd9378b"
```

Your test can then send requests with any method to any URL under `/apps/:app_id/test`:

```
curl -X POST http://localhost:8080/apps/40f7f6db-7e19-451f-8cd9-a6376cd9378b/test/users -d ...
curl -X GET http://localhost:8080/apps/40f7f6db-7e19-451f-8cd9-a6376cd9378b/test/users/123
curl -X DELETE http://localhost:8080/apps/40f7f6db-7e19-451f-8cd9-a6376cd9378b/test/users/123
...
```

If a handler matches the request, the request will be logged, and the handler's response will be returned.  Otherwise, `500 Internal Server Error` will be returned:

```
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8
Content-Length: 45
...
```
```JSON
{
  "message": "No matching handler found."
}
```

Your test can retrieve the app's logs with `GET /apps/:app_id/logs`:

`curl http://localhost:8080/apps/40f7f6db-7e19-451f-8cd9-a6376cd9378b/logs`

```JSON
{
  "items": [
    {
      "date": "2016-03-11T22:24:37.144Z",
      "request": {
        "protocol": "http",
        "method": "POST",
        "fullUrl": "/apps/d08a8a40-cd3a-4825-99e8-bf494280cdaa/test/users",
        "relativeUrl": "/users",
        "headers": {
          "content-type": "application/json",
          "host": "localhost:9300",
          "accept": "application/json",
          "content-length": "26",
          "connection": "keep-alive"
        },
        "body": {
          "username": "colincoller"
        }
      },
      "handler": "on-create-user",
      "response": {
        "status": 201,
        "headers": {
          "Location": "/users/123"
        },
        "body": "/users/123"
      }
    },
    {
      "date": "2016-03-11T22:24:37.154Z",
      "request": {
        "protocol": "http",
        "method": "GET",
        "fullUrl": "/apps/d08a8a40-cd3a-4825-99e8-bf494280cdaa/test/users/123",
        "relativeUrl": "/users/123",
        "headers": {
          "content-type": "application/json",
          "host": "localhost:9300",
          "connection": "keep-alive"
        },
        "body": {}
      },
      "handler": "on-get-user",
      "response": {
        "status": 200,
        "body": {
          "username": "colincoller"
        }
      }
    }
  ]
}
```

Finally, your test can delete the app with `DELETE /apps/:app_id`:

```
curl -X DELETE http://localhost:8080/apps/40f7f6db-7e19-451f-8cd9-a6376cd9378b
```

### Matching requests
Handlers can match requests on protocol, method, URL, parameters, and headers:

```JSON
{
  "handlers": [
    {
      "id": "on-get-user",
      "request": {
        "protocol": "https",
        "method": "GET",
        "url": "/users/:id"
```

`url` and `headers` values are matched using the [url-pattern](https://www.npmjs.com/package/url-pattern) package and support parameters.  `headers` keys and all other request properties are matched exactly.

Each of these request properties is optional.  If you don't supply a request property, the handler will ignore that property when matching requests.  If you don't supply _any_ request properties, the handler will match _every_ request.  For example, [matchEverything.json](samples/matchEverything.json) defines an app that matches every request, regardless of protocol, method, URL, etc, and sends `200 OK`:

```JSON
{
  "handlers": [
    {
      "id": "on-anything",
      "response": {
        "status": 200,
        "body": "Everything is going to be 200 OK"
      }
    }
  ]
}
```

### Sending responses
When a handler matches a request, the handler will send a response.  The response includes a HTTP status coode, optional headers, and an optional body.  

```JSON
{
  "handlers": [
    {
      "id": "on-create-user",
      "response": {
        "status": 201,
        "headers": {
          "Location": "/users/123"
        },
        "body": "/users/123"
```

The response will automatically include the `Content-Type` and `Content-Length` headers when appropriate.

### Multiple handlers
Apps can have multiple handlers matching different requests and sending different responses.  Handlers are invoked one at a time, in the order they are defined in the app, until a handler matches the request.  For example, [multipleHandlers.json](samples/multipleHandlers.json) defines an app with three handlers:

1. Match `POST .../users` and send `201 Created` with a `Location` header and a JSON string body
2. Match `GET .../users/:id` and send `200 OK` with a JSON object body
3. Match `DELETE .../users/:id` and send `204 No Content`

```JSON
{
  "handlers": [
    {
      "id": "on-create-user",
      "request": {
        "method": "POST",
        "url": "/users"
      },
      "response": {
        "status": 201,
        "headers": {
          "Location": "/users/123"
        },
        "body": "/users/123"
      }
    },
    {
      "id": "on-get-user",
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 200,
        "body": {
          "username": "colincoller"
        }
      }
    },
    {
      "id": "on-delete-user",
      "request": {
        "method": "DELETE",
        "url": "/users/:id"
      },
      "response": {
        "status": 204
      }
    }
  ]
}
```

### Delaying responses
Handlers can delay responses by an arbitrary amount of time by setting the `delay` property on the handler's response object.  `delay` is in milliseconds.

```JSON
{
  "handlers": [
    {
      "id": "on-get-user-1",
      "response": {
        "delay": 3000
```

This is useful when testing how webhooks deal with timeouts.

### Matching requests a maximum number of times 
Handlers can match requests a maximum number of times before falling through to subsequent handlers by setting the `maxMatches` property on the handler object. 

```JSON
{
  "handlers": [
    {
      "id": "on-get-user-1",
      "maxMatches": 1
```

This is useful when testing retries due to errors.  For example, [errorRetries.json](samples/errorRetries.json) defines an app with two handlers that match `GET .../users/:id`:

1. On the first request, send `500 Internal Server Error`
2. On the second request (when retrying), send `200 OK` with a JSON object body

```JSON
{
  "handlers": [
    {
      "id": "on-get-user-1",
      "maxMatches": 1,
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 500
      }
    },
    {
      "id": "on-get-user-2",
      "maxMatches": 1,
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 200,
        "body": {
          "username": "colincoller"
        }
      }
    }
  ]
}
```

This is also useful when testing retries due to timeouts.  For example, [timeoutRetries.json](samples/timeoutRetries.json) defines an app with two handlers that match `GET .../users/:id`:

1. On the first request, delay the response for longer than the caller will wait
2. On the second request (when retrying), send `200 OK` with a JSON object body

```JSON
{
  "handlers": [
    {
      "id": "on-get-user-1",
      "maxMatches": 1,
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "delay": 3000,
        "status": 200,
        "body": {
          "username": "The caller should have timed out in less than 3 seconds and so should never see this."
        }
      }
    },
    {
      "id": "on-get-user-2",
      "maxMatches": 1,
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 200,
        "body": {
          "username": "colincoller"
        }
      }
    }
  ]
}
```

This is _also_ useful when testing complex sequences of webhook calls where the same request is made multiple times and the test requires different responses for each.  For example, [differentResponses.json](samples/differentResponses.json) defines an app with three handlers that all match `GET .../users/:id`:

1. On the first request (before the user would have been created), send `404 Not Found`
2. On the second request (after the user has been created), send `200 OK` with a JSON object body
3. On the third and subsequent requests (after the user has been deleted), send `404 Not Found`

```JSON
{
  "handlers": [
    {
      "id": "on-get-user-1",
      "maxMatches": 1,
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 404
      }
    },
    {
      "id": "on-get-user-2",
      "maxMatches": 1,
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 200,
        "body": {
          "username": "colincoller"
        }
      }
    },
    {
      "id": "on-get-user-3",
      "request": {
        "method": "GET",
        "url": "/users/:id"
      },
      "response": {
        "status": 404
      }
    }
  ]
}
```

### Per-app logging
Rogue logs all requests to an app.  Each log entry includes the date the request was received, key request properties, the identifier of the handler that matched the request, and key response properties.  

```JSON
[
  {
    "date": "2016-03-11T22:24:37.144Z",
    "request": {
      "protocol": "http",
      "method": "POST",
      "fullUrl": "/apps/d08a8a40-cd3a-4825-99e8-bf494280cdaa/test/users",
      "relativeUrl": "/users",
      "headers": {
        "content-type": "application/json",
        "host": "localhost:9300",
        "accept": "application/json",
        "content-length": "26",
        "connection": "keep-alive"
      },
      "body": {
        "username": "colincoller"
      }
    },
    "handler": "on-create-user",
    "response": {
      "status": 201,
      "headers": {
        "Location": "/users/123"
      },
      "body": "/users/123"
    }
  },
  {
    "date": "2016-03-11T22:24:37.154Z",
    "request": {
      "protocol": "http",
      "method": "GET",
      "fullUrl": "/apps/d08a8a40-cd3a-4825-99e8-bf494280cdaa/test/users/123",
      "relativeUrl": "/users/123",
      "headers": {
        "content-type": "application/json",
        "host": "localhost:9300",
        "connection": "keep-alive"
      },
      "body": {}
    },
    "handler": "on-get-user",
    "response": {
      "status": 200,
      "body": {
        "username": "colincoller"
      }
    }
  }
]
```

Rogue logs in a single log for the app rather than a log for each handler.  This simplifies test scenarios where you want to assert that multiple webhook calls have been made in a particular order.

### HTTP and HTTPS
Rogue can listen both for HTTP and HTTPS without the use of a proxy.  To enable HTTPS, edit `package.json`, set `https` to `true`, and set `httpsPort`, `httpsKey`, and `httpsCert` appropriately.

```JSON
{
  "config": {
    "https": true,
    "httpsPort": 8443,
    "httpsCert": "/path/to/cert",
    "httpsKey": "/path/to/key"
```

### Basic authentication
Rogue can require basic authentication to call its static API without the use of a proxy.  To enable basic authentication, edit `package.json` and set `username` and `password` appropriately.

```JSON
{
  "config": {
    "username": "colincoller",
    "password": "HighlandPark21!",
```

### Pluggable persistance
Rogue supports pluggable persistence.  The only persistence currently included is `memory`.  If you want to build your own persistence (e.g. MySQL), create a new class in `src/persistence/` (`src/persistence/mysql.js`), and set `persistence` to the name of the file without the .js suffix (`mysql`).  The tests in `test/persistence.js` are written to be executed against any persistence implementation.

```JSON
{
  "config": {
    "persistence": "mysql
```

## Missing Features
This is a list of key features that [Mockbin](https://github.com/Mashape/mockbin) has that Rogue does not:

- [HAR](http://www.softwareishard.com/blog/har-12-spec/): Rogue's logs don't use the [HAR](http://www.softwareishard.com/blog/har-12-spec/) format.
- Content negotiation: Rogue only supports JSON.
- JSONP: Rogue doesn't support JSONP.
- User interface: Rogue doesn't have a user interface for creating apps, testing handlers, or viewing logs.  If you're looking for visual testing and debugging tools, see John Sheehan's [excellent, if slightly-outdated, list of API and webhook testing tools](http://john-sheehan.com/blog/ultimate-api-webhook-backend-service-debugging-testing-monitoring-and-discovery-tools-list).

If you'd like to contribute one of these features, or any features or bug fixes, please submit a pull request!

## License
[MIT](LICENSE) Copyright &copy; 2016 [Uberflip](http://www.uberflip.com)

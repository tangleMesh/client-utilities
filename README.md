# Client utilities

This is a collection of some helpful client tools.

## Http client

The http-client can be used to make ajax requests in a client application. It takes automatical care of xss and csrf attacks.
Simply include the `http-client.js` file into your application and start using the http-client.

```html
<!DOCTYPE html>
<html>
<body>

    <h1>My First Heading</h1>
    <p>My first paragraph.</p>

    <script src="../http-client.js"></script>
    <script>
        var httpClient = new HttpClient ("https://some-api.url");
    </script>
</body>
</html>
```

In order to use the client you have to create an object of it:

`var client = new HttpClient (url, twoFactorToken)`

The `twoFactorToken` is optional and can be skipped, if not needed for the request.

### Methods

There are several methods available after constructing the `HttpClient`:

#### Set additional headers

With the method `setHeader` you can set additional headers that will be sent on each request:

`client.setHeader (name, value);`

#### Make requests

With the method `request (callback, method, path, queryParameters, data, headers)` you can do a single request.
The callback is always in the following syntax:

```js
client.request (function (error, result) {
    console.log (error, result);
}, "POST", "/do-something", {}, {
    some: "Post data"
});
```

#### Simplify requests with the following wrapper-methods

```js
client.get (callback, path, queryParameters, headers);

client.post (callback, path, data, queryParameters, headers);

client.put (callback, path, data, queryParameters, headers);

client.patch (callback, path, data, queryParameters, headers);

client.delete (callback, path, queryParameters, headers);
```

#### Successful response

```js
{
    success: true,
    result: {
        result: "from server",
    },
    statusCode: 200,
}
```

#### Error response

```js
{
    success: false,
    statusCode: 500,
    message: "Error message",
    details: {
        errorDetails: "in here"
    },
    error: {
        errorObject: "string",
    }
}
```
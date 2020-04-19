function HttpClient (url, twoFactorToken) {
    this.url = url.substring (-1) === "/" ? url.substring (0, url.length - 1) : url;
    this.headers = {};
    if (twoFactorToken) {
        this.headers ["X-TWO-FACTOR"] = twoFactorToken;
    }
    this.csrfToken = null;
    if (sessionStorage.getItem ("csrfToken")) {
        this.csrfToken = sessionStorage.getItem ("csrfToken");
    }
};

HttpClient.prototype.setHeader = function (name, value) {
    this.headers [name] = value;
}

HttpClient.prototype._parseResponse = function (response) {
    try {
        return JSON.parse (response);
    } catch (e) {
        return response;
    }
}

HttpClient.prototype._resolveError = function (message, statusCode, details, errorObject) {
    return {
        success: false,
        statusCode: statusCode ? statusCode : 500,
        message: message,
        details: details ? details : {},
        error: errorObject ? errorObject : {},
    };
}

HttpClient.prototype._resolveSuccess = function (result, statusCode) {

    const parsedResponse = this._parseResponse (result);
    // Set csrf-token if response includes one
    if (parsedResponse.csrfToken) {
        sessionStorage.setItem ("csrfToken", parsedResponse.csrfToken);
        this.csrfToken = parsedResponse.csrfToken;
    }
    
    return {
        success: true,
        result: parsedResponse,
        statusCode: statusCode ? statusCode : 200,
    };
}

HttpClient.prototype._resolveQueryParameters = function (queryParameters) {
    if (!queryParameters || Object.keys (queryParameters).length <= 0) {
        return "";
    }
    let query = "?";
    Object.keys (queryParameters).forEach (function (key) {
        query = query + encodeURIComponent (key) + "=" + encodeURIComponent (queryParameters [key]) + "&";
    });
    return query.substring (0, query.length - 1);
}

HttpClient.prototype._resolveResponse = function (callback, readyState, status, responseText) {
    if (readyState !== 4) {
        return;
    }
    var response = this._parseResponse (responseText);
    if (status >= 400) {
        return callback (this._resolveError (
            response.message ? response.message : "Invalid response from server!",
            status,
            {
                response: response,
                code: response.code,
                details: response.details,
            }
        ), null);
    }
    return callback (null, this._resolveSuccess (
        responseText,
        status
    ));
}

HttpClient.prototype._getCookie = function (cookieName) {
    var name = cookieName + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

HttpClient.prototype.request = function (callback, method, path, queryParameters, data, headers) {
    try {
        // prepare path
        path = path ? path : "/";
        path = path.substring (0, 1) !== "/" ? "/" + path : path;

        // prepare data
        if (method.toUpperCase () === "GET") {
            data = "";
        } else {
            data = JSON.stringify (data);
        }

        // initialize ajax-client
        var xhttp = new XMLHttpRequest ();
        xhttp.open(method.toUpperCase (), this.url + path + this._resolveQueryParameters (queryParameters), true);

        // add headers
        xhttp.setRequestHeader("Content-type", "application/json");
        Object.keys (this.headers).forEach (function (key) {
            xhttp.setRequestHeader(key, this.headers [key]);
        });
        headers = headers ? headers : {};
        Object.keys (headers).forEach (function (key) {
            xhttp.setRequestHeader(key, headers [key]);
        });

        xhttp.withCredentials = true;

        // add X-CSRF-TOKEN header, if cookie exists
        if (this._getCookie ("X-CSRF-TOKEN")) {
            xhttp.setRequestHeader("X-CSRF-TOKEN", this._getCookie ("X-CSRF-TOKEN"));
        }
        // add X-CSRF-TOKEN header, if sessionStorage entry
        else if (this.csrfToken) {
            xhttp.setRequestHeader("X-CSRF-TOKEN", this.csrfToken);
        }

        // Add state-change listener
        let self = this;
        xhttp.onreadystatechange = function () {
            return self._resolveResponse (callback, this.readyState, this.status, this.responseText);
        };

        // Send the request
        xhttp.send (data);

    } catch (e) {
        return callback (this._resolveError ("Unknown error happened!", 500, {}, e), null);
    }
}

HttpClient.prototype.get = function (callback, path, queryParameters, headers) {
    return this.request (callback, "GET", path, queryParameters, {}, headers);
}

HttpClient.prototype.post = function (callback, path, data, queryParameters, headers) {
    return this.request (callback, "POST", path, queryParameters, data, headers);
}

HttpClient.prototype.put = function (callback, path, data, queryParameters, headers) {
    return this.request (callback, "PUT", path, queryParameters, data, headers);
}

HttpClient.prototype.patch = function (callback, path, data, queryParameters, headers) {
    return this.request (callback, "PATCH", path, queryParameters, data, headers);
}

HttpClient.prototype.delete = function (callback, path, queryParameters, headers) {
    return this.request (callback, "DELETE", path, queryParameters, {}, headers);
}
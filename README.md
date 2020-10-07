# chilli-client 🌶️
#### A very small wrapper around the base node https client that allows you to make requests using Promises and a familiar API.
## Install
```
npm i chilli-client
```
## Usage
### Basic GET Request
```javascript
const chilli = require('chilli-client');

chilli.get('https://google.com')
.then(res => console.log(res));
```
### GET Request With Options
chilli-client accepts the standard https.request options object outlined [here](https://nodejs.org/api/http.html#http_http_request_options_callback). Additionally, you can add the
`includeTimings` and `includeRawResponse` properties to the options object to include an object that contains the time it took various parts of the request to run and the raw 
`http.IncomingMessage` contents.

```javascript
chilli.get('https://google.com', {
  includeTimings: true
}).then(res => {
  console.log(res);
});
```

### POST Request
```javascript
chilli.post('https://google.com', {
  name: 'Samantha',
  password: 'password',
}, {
  includeTimings: true
})
```

### Response Object
chilli-client returns a developer-friendly response object. It does not make any assumptions about the response, and, unlike similar http clients, will not automatically throw
an error when the status code is outside of the 200 range.

```typescript
interface ChilliResponse {
  body: string | Object, // will decode response body to JavaScript object if Content-Type header is application/json
  statusCode: number,
  statusMessage: string,
  raw: http.IncomingMessage,
  timings: Timings
}

interface Timings {
  total: number,
  dnsLookup: number,
  tcpConnection: number,
  tlsHandshake: number,
  firstByte: number,
  streamRes: number
}
```

const https = require('https');
const process = require('process');

function chilli(url, options = {}, data) {
  let parsedURL = new URL(url);

  options.host = options.host || parsedURL.host;
  options.method = options.method || 'GET';
  options.protocol = options.protocol || parsedURL.protocol;
  options.path = options.path || parsedURL.pathname;

  return new Promise((resolve, reject) => {
    const timings = generateTimings();

    const request = https.request(options, res => {
      let resBody = [];

      res.once('readable', () => {
        timings.firstByte = process.hrtime.bigint();
      });

      res.on('data', data => {
        resBody.push(data);
      });

      res.on('end', () => {
        timings.ended = process.hrtime.bigint();

        const bodyString = resBody.join('').toString();
        let body;

        console.log(res.headers);

        if (res.headers['content-type'] && res.headers['content-type'].startsWith('application/json')) {
          body = JSON.parse(bodyString);
        } else {
          body = bodyString;
        }

        const output = {
          body,
          headers: res.headers,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        };

        if (options.includeTimings) {
          output.timing = calcTimingDiffs(timings);
        }

        if (options.includeRawResponse) {
          output.raw = res;
        }
        
        return resolve(output);
      });
    });

    request.on('socket', socket => {
      socket.on('lookup', () => {
        timings.dnsLookup = process.hrtime.bigint();
      });
      socket.on('connect', () => {
        timings.tcpConnection = process.hrtime.bigint();
      });
      socket.on('secureConnect', () => {
        timings.tlsHandshake = process.hrtime.bigint();
      });
    });

    request.on('error', err => {
      return reject(err);
    });

    if (data) {
      const data = JSON.stringify(data);
      request.write(data);
    }

    request.end();
  });
}

chilli.get = async (url, options = {}) => {
  options.method = 'GET';
  return chilli(url, options);
};

chilli.post = async (url, body, options = {}) => {
  options.method = 'POST';
  return chilli(url, options, body);
};

function generateTimings() {
  return {
    started: process.hrtime.bigint(),
    dnsLookup: undefined,
    tcpConnection: undefined,
    tlsHandshake: undefined,
    firstByte: undefined,
    ended: undefined,
  };
}

function calcTimingDiffs(timings) {
  const NANO_TO_MS = 1000000n;
  
  const totalTime = (timings.ended - timings.started) / NANO_TO_MS;
  const dnsLookup = (timings.dnsLookup - timings.started) / NANO_TO_MS;
  const tcpConnection = (timings.tcpConnection - timings.dnsLookup) / NANO_TO_MS;
  const tlsHandshake = (timings.tlsHandshake - timings.tcpConnection) / NANO_TO_MS;
  const firstByte = (timings.firstByte - timings.tlsHandshake) / NANO_TO_MS;
  const streamRes = (timings.ended - timings.firstByte) / NANO_TO_MS;

  return {
    total: parseInt(totalTime),
    dnsLookup: parseInt(dnsLookup),
    tcpConnection: parseInt(tcpConnection),
    tlsHandshake: parseInt(tlsHandshake),
    firstByte: parseInt(firstByte),
    streamRes: parseInt(streamRes),
  };
}

exports = chilli;
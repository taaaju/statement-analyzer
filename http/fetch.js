import fetch from 'node-fetch';
import http from 'http';
import https from 'https';
import { getSecrets } from '../secrets/index.js';

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

const agent = (_parsedURL) => { 
  return _parsedURL.protocol == 'http:' ? httpAgent : httpsAgent;
}

export const httpClient = async (url, request, headers) => {
  var start_time = new Date().getTime();
  let payload = request;
  if (typeof payload == "object") {
    payload = JSON.stringify(request);
  }

  let response = await fetch(url, {
    method: 'post',
    body: payload,
    headers: headers,
    agent
  });

  var time = { 'Response time': + (new Date().getTime() - start_time) + 'ms' };

  console.log(time)
  return response;
}



export const fetchAll = async(requests) => {
  const promises = [];
  const secrets = getSecrets();
  for (var i = 0; i < requests.length; i++) {
    const req = requests[i];
    const parsed = JSON.parse(req);

    promises.push(
      httpClient(
        'https://poc-test.theoxygen.com/services/client/v1/temp/vfs/you-verify-bvn',
        req,
        { 'Content-Type': 'application/json' }
      )
      .then(response =>  { return { 
        identifier: parsed['request_identifier'],
        'response': response,
        'request': parsed, 
        type: 'bvn' 
      }; }
    ));

    promises.push(
      httpClient(
        'https://poc-test.theoxygen.com/services/client/v1/temp/vfs/you-verify-nin',
        req, 
        { 'Content-Type': 'application/json' }
      ).then(response =>  { 
        return { 
          identifier: parsed['request_identifier'],
          'response': response,
          'request': parsed,
          type: 'nin'
        }; }
    ));
  }

  return Promise.allSettled(promises);
}
import fetch from 'node-fetch';
import http from 'http';
import https from 'https';

const agent = new https.Agent({ keepAlive: true });

const iCadHeaders = {
}

const iCadBody = {

}

const headers = {
}

const body = {
}

const httpClient = async (request, headers) => {
  var start_time = new Date().getTime();
const params = new URLSearchParams();

for (var key in request) {
  params.append(key, request[key]);
}

  let response = await fetch('https://apitest.nibss-plc.com.ng/v2/reset', {
    method: 'post',
    body: new URLSearchParams(request),
    headers: headers,
    agent: agent
  });

  var time = { 'Response time': + (new Date().getTime() - start_time) + 'ms' };

  console.log(time)

  return response;
}


export const icadToken = await httpClient(iCadBody, iCadHeaders);

export const uivToken = await httpClient(body, headers);


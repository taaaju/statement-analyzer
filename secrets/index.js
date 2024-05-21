import fetch from 'node-fetch';
import { fetchLocalSecrets } from './local.js';

const isLocal = process.env.IS_LOCAL ? true : false;

const headers = {
  "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN
}

const secrets = {}

const isEmpty = (obj) => {
  if (obj != null && typeof obj == "object") {
    return Object.keys(obj) > 0;
  }
  return true;
}

const fetchSecrets = async () => {

  let secretsResponse = await fetch("http://localhost:" + process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT + "/secretsmanager/get?secretId=" + process.env.OXY_SECRETS_ID, {
    method: 'get',
    headers: headers
  });
  const outcome = await secretsResponse.json();
  let secrets = {};
  if (outcome != null) {
    const secretString = outcome['SecretString'];
    secrets = JSON.parse(secretString);
  }

  return secrets;
}

export const getSecrets = async () => {
  if (isEmpty(secrets)) {
    console.log("Using secrets already read...");
  } else {
    // if (isLocal) {
    //   const secs = await fetchLocalSecrets();
    //   outcome = JSON.parse(secs);
    // } else {
    //   const secs = await fetchSecrets();
    //   outcome = secs.json();

    // }

      const secs = await fetchLocalSecrets();
      const outcome = JSON.parse(secs);

    const keys = Object.keys(outcome);
    for (var i = keys.length - 1; i >= 0; i--) {
      secrets[keys[i]] = outcome[keys[i]];
    }
  }

  return secrets;
}

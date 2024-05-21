import * as decoder from './utils/decoder.js';
import * as fetcher from './http/fetch.js';
import { getSecrets } from './secrets/index.js';
import { processor } from './processor.js';

const headers = {
  "X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN
}


// https://github.com/delventhalz/simple-concurrency-test


export const handler = async (event) => {
  // console.log(process.env)
  const secrets = await getSecrets();


  if (event != null && event.messages != null) {
    let length = event.messages.length;
    let kycRecords = [];
    if (length != null) {
      for (let i in event.messages) {
        kycRecords.push(JSON.parse(decoder.decode(event.messages[i].data)));
      }

      // console.log(JSON.stringify(kycRecords, null, 2));
      const records = await fetcher.fetchAll(kycRecords);
      processor(records);
    }
  
  }

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};

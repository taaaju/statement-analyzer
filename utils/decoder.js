export const decode = (data) => {
  let buff = Buffer.from(data, 'base64');
  return buff.toString();
}


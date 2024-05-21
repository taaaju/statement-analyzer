import fs from 'node:fs';

export const fetchLocalSecrets = async () => {
  return fs.readFileSync('./secs.json', 'utf8');
}


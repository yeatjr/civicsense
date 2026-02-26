const https = require('https');
const key = 'AIzaSyCBBhv5HQMFiFAbiTxW6ydPhl6GCVBDLj8';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    const modelNames = json.models.map(m => m.name.replace('models/', ''));
    console.log(modelNames.join('\n'));
  });
}).on('error', (err) => {
  console.error(err);
});

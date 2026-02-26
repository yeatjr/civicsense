const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyCBBhv5HQMFiFAbiTxW6ydPhl6GCVBDLj8');

async function list() {
  try {
    const models = await genAI.listModels();
    console.log(JSON.stringify(models, null, 2));
  } catch (e) {
    console.error(e);
  }
}
list();

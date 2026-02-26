async function checkModels() {
  const key = 'AIzaSyCBBhv5HQMFiFAbiTxW6ydPhl6GCVBDLj8';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
checkModels();

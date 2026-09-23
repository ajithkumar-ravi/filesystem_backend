fetch('http://localhost:5000/api/files')
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);

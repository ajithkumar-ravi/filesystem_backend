const fileService = require('./src/services/fileService');

async function test() {
  try {
    const res = await fileService.getChildren(null);
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit();
}

test();

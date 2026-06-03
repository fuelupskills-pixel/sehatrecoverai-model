try {
  const jsdom = require("jsdom");
  console.log("jsdom is installed!");
} catch (e) {
  console.log("jsdom is NOT installed:", e.message);
}

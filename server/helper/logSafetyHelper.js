let configured = false;

function suppressVerboseLogsInProduction(env = process.env) {
  if (configured || env.NODE_ENV !== "production") return;
  console.log = () => {};
  console.info = () => {};
  configured = true;
}

module.exports = {
  suppressVerboseLogsInProduction,
};

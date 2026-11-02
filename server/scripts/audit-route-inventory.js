const app = require("../app");
const { collectRoutes } = require("../security/routeInventory");

const routes = collectRoutes(app);
if (process.argv.includes("--json")) {
  console.log(JSON.stringify(routes, null, 2));
} else {
for (const route of routes) {
  const permission = route.permission
    ? JSON.stringify(route.permission)
    : "n/a";
  console.log(
    `${route.method.padEnd(6)} ${route.path.padEnd(62)} ${route.access.padEnd(30)} ${permission}`
  );
}
}

const unmappedAdmin = routes.filter(
  (route) => route.access === "admin" && !route.permission
);
if (unmappedAdmin.length > 0) {
  console.error(`\n${unmappedAdmin.length} admin route belum memiliki permission rule.`);
  process.exitCode = 1;
}

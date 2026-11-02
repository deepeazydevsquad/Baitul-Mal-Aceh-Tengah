const { getRoutePolicy } = require("./routePolicy");

function classifyRoute(method, path) {
  const policy = getRoutePolicy(method, path);
  let permission = policy.permission;
  if (policy.access === "document-owner-or-capability") {
    permission = "record-scope";
  } else if (policy.access === "member") {
    permission = "owner-scope";
  } else if (policy.authOnly) {
    permission = "self-profile";
  }
  return { access: policy.access, permission };
}

function collectRoutes(app) {
  const routes = [];

  function walk(stack) {
    for (const layer of stack || []) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) {
          if (!layer.route.methods[method]) continue;
          routes.push({
            method: method.toUpperCase(),
            path: layer.route.path,
            ...classifyRoute(method, layer.route.path),
          });
        }
      } else if (layer.name === "router" && layer.handle?.stack) {
        walk(layer.handle.stack);
      }
    }
  }

  walk(app._router?.stack);
  return routes.sort((a, b) =>
    `${a.path} ${a.method}`.localeCompare(`${b.path} ${b.method}`)
  );
}

module.exports = { classifyRoute, collectRoutes };

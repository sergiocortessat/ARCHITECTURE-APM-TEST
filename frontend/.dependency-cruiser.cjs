/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "infra-no-presentacion",
      comment: "frontend/lib (infraestructura) no importa presentacion (frontend/app).",
      severity: "error",
      from: { path: "^lib/" },
      to: { path: "^app/" },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    exclude: { path: "^(\\.next|node_modules|__tests__)" },
  },
};

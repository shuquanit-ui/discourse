/* eslint-disable ember/route-path-style */
export default {
  resource: "admin.adminPlugins",
  path: "/plugins",

  map() {
    this.route("keyword_glossary", { path: "/keyword-glossary" });
  },
};

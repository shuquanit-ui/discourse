import { withPluginApi } from "discourse/lib/plugin-api";

const ROOT_PATH = "/admin/plugins/keyword-glossary";
const ENTRIES_PATH = "/admin/plugins/keyword-glossary/entries";

function normalizePath(url) {
  return (url || "").replace(/\/+$/, "") || "/";
}

export default {
  name: "keyword-glossary-admin-plugin-root-redirect",

  initialize(container) {
    const currentUser = container.lookup("service:current-user");

    if (!currentUser?.admin) {
      return;
    }

    withPluginApi("1.30.0", (api) => {
      api.onPageChange((url) => {
        if (normalizePath(url) === ROOT_PATH) {
          window.location.replace(ENTRIES_PATH);
        }
      });
    });
  },
};

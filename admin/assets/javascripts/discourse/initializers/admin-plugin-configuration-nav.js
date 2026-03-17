import { withPluginApi } from "discourse/lib/plugin-api";

const PLUGIN_ID = "keyword-glossary";

export default {
  name: "keyword-glossary-admin-plugin-configuration-nav",

  initialize(container) {
    const currentUser = container.lookup("service:current-user");
    if (!currentUser?.admin) {
      return;
    }

    withPluginApi((api) => {
      api.setAdminPluginIcon(PLUGIN_ID, "book-open");
    });
  },
};

import { withPluginApi } from "discourse/lib/plugin-api";

const PLUGIN_ID = "discourse-keyword-glossary";

export default {
  name: "keyword-glossary-admin-plugin-configuration-nav",

  initialize(container) {
    const currentUser = container.lookup("service:current-user");
    if (!currentUser?.admin) {
      return;
    }

    withPluginApi((api) => {
      api.setAdminPluginIcon(PLUGIN_ID, "book-open");

      api.addAdminPluginConfigurationNav(PLUGIN_ID, [
        {
          label: "keyword_glossary.manage_nav",
          route: "adminPlugins.show.discourse-keyword-glossary-entries",
          description: "keyword_glossary.manage_nav_description",
        },
      ]);
    });
  },
};

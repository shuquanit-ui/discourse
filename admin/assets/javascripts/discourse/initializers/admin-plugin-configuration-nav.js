import { withPluginApi } from "discourse/lib/plugin-api";

const PLUGIN_ID = "keyword-glossary";

export default {
  name: "keyword-glossary-admin-plugin-configuration-nav",

  initialize(container) {
    const currentUser = container.lookup("service:current-user");

    if (!currentUser?.admin) {
      return;
    }

    withPluginApi("1.30.0", (api) => {
      api.setAdminPluginIcon(PLUGIN_ID, "book-open");
      api.addAdminPluginConfigurationNav(PLUGIN_ID, [
        {
          route: "adminPlugins.show.keyword-glossary-entries",
          label: "keyword_glossary.manage_nav",
          description: "keyword_glossary.manage_nav_description",
        },
      ]);
    });
  },
};

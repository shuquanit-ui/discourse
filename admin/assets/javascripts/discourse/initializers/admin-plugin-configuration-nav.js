import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.30.0", (api) => {
  const currentUser = api.getCurrentUser();

  if (!currentUser?.admin) {
    return;
  }

  api.addAdminPluginConfigurationNav("keyword-glossary", [
    {
      route: "adminPlugins.show.keyword-glossary-entries",
      label: "keyword_glossary.manage_nav",
      description: "keyword_glossary.manage_nav_description",
    },
  ]);
});

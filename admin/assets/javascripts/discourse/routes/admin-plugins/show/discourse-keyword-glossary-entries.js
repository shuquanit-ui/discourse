import { ajax } from "discourse/lib/ajax";
import DiscourseRoute from "discourse/routes/discourse";

export default class AdminPluginsShowDiscourseKeywordGlossaryEntriesRoute extends DiscourseRoute {
  titleToken() {
    return "词条管理";
  }

  async model() {
    return ajax("/admin/plugins/discourse-keyword-glossary/api/entries.json");
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.loadModel(model);
  }
}

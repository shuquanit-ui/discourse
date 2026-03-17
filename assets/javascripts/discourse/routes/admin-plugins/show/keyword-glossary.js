import { ajax } from "discourse/lib/ajax";
import DiscourseRoute from "discourse/routes/discourse";

export default class AdminPluginsShowKeywordGlossaryRoute extends DiscourseRoute {
  async model() {
    return ajax("/admin/plugins/keyword-glossary/entries.json");
  }

  setupController(controller, model) {
    super.setupController(controller, model);
    controller.loadModel(model);
  }
}

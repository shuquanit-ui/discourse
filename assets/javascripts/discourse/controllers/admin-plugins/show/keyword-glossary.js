import Controller from "@ember/controller";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { ajax } from "discourse/lib/ajax";
import I18n from "discourse-i18n";

function defaultForm() {
  return {
    id: null,
    term: "",
    aliasesText: "",
    description: "",
    link_url: "",
    enabled: true,
  };
}

function toAliases(text) {
  return (text || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default class AdminPluginsShowKeywordGlossaryController extends Controller {
  @tracked entries = [];
  @tracked meta = {};
  @tracked loading = false;
  @tracked saving = false;
  @tracked notice = null;
  @tracked error = null;
  @tracked form = defaultForm();

  loadModel(payload) {
    this.entries = payload.entries || [];
    this.meta = payload.meta || {};
    this.loading = false;
    this.notice = null;
    this.error = null;
    this.form = defaultForm();
  }

  get isEditing() {
    return Boolean(this.form.id);
  }

  get hasLegacyImport() {
    return this.meta?.has_legacy_entries && !this.meta?.imported_at;
  }

  setField(field, value) {
    this.form = { ...this.form, [field]: value };
  }

  buildPayload() {
    return {
      term: this.form.term.trim(),
      aliases: toAliases(this.form.aliasesText),
      description: this.form.description.trim(),
      link_url: this.form.link_url.trim(),
      enabled: this.form.enabled,
    };
  }

  async refreshEntries() {
    this.loading = true;
    this.error = null;

    try {
      const payload = await ajax("/admin/plugins/keyword-glossary/entries.json");
      this.entries = payload.entries || [];
      this.meta = payload.meta || {};
    } catch {
      this.error = I18n.t("keyword_glossary.errors.load_failed");
    } finally {
      this.loading = false;
    }
  }

  @action
  startCreate() {
    this.notice = null;
    this.error = null;
    this.form = defaultForm();
  }

  @action
  editEntry(entry) {
    this.notice = null;
    this.error = null;
    this.form = {
      id: entry.id,
      term: entry.term || "",
      aliasesText: (entry.aliases || []).join("\n"),
      description: entry.description || "",
      link_url: entry.link_url || "",
      enabled: entry.enabled ?? true,
    };
  }

  @action
  cancelEdit() {
    this.notice = null;
    this.error = null;
    this.form = defaultForm();
  }

  @action
  updateTerm(event) {
    this.setField("term", event.target.value);
  }

  @action
  updateAliases(event) {
    this.setField("aliasesText", event.target.value);
  }

  @action
  updateDescription(event) {
    this.setField("description", event.target.value);
  }

  @action
  updateLinkUrl(event) {
    this.setField("link_url", event.target.value);
  }

  @action
  toggleFormEnabled(event) {
    this.setField("enabled", event.target.checked);
  }

  @action
  async saveEntry(event) {
    event?.preventDefault();
    this.saving = true;
    this.notice = null;
    this.error = null;

    const payload = { entry: this.buildPayload() };

    try {
      if (this.isEditing) {
        await ajax(`/admin/plugins/keyword-glossary/entries/${this.form.id}.json`, {
          type: "PUT",
          data: payload,
        });
      } else {
        await ajax("/admin/plugins/keyword-glossary/entries.json", {
          type: "POST",
          data: payload,
        });
      }

      this.notice = I18n.t("keyword_glossary.save_success");
      this.form = defaultForm();
      await this.refreshEntries();
    } catch (error) {
      this.error =
        error?.jqXHR?.responseJSON?.errors?.[0] ||
        I18n.t("keyword_glossary.errors.save_failed");
    } finally {
      this.saving = false;
    }
  }

  @action
  async deleteEntry(entry) {
    if (!window.confirm(`${I18n.t("keyword_glossary.delete")} ${entry.term}?`)) {
      return;
    }

    this.notice = null;
    this.error = null;

    try {
      await ajax(`/admin/plugins/keyword-glossary/entries/${entry.id}.json`, {
        type: "DELETE",
      });
      this.notice = I18n.t("keyword_glossary.delete_success");
      if (this.form.id === entry.id) {
        this.form = defaultForm();
      }
      await this.refreshEntries();
    } catch {
      this.error = I18n.t("keyword_glossary.errors.delete_failed");
    }
  }

  @action
  async toggleEntry(entry) {
    this.notice = null;
    this.error = null;

    try {
      await ajax(`/admin/plugins/keyword-glossary/entries/${entry.id}.json`, {
        type: "PUT",
        data: {
          entry: {
            term: entry.term,
            aliases: entry.aliases || [],
            description: entry.description,
            link_url: entry.link_url,
            enabled: !entry.enabled,
          },
        },
      });
      await this.refreshEntries();
    } catch {
      this.error = I18n.t("keyword_glossary.errors.save_failed");
    }
  }

  @action
  async importLegacy() {
    this.notice = null;
    this.error = null;

    try {
      const response = await ajax("/admin/plugins/keyword-glossary/import-legacy.json", {
        type: "POST",
      });
      this.notice =
        response?.meta?.imported > 0
          ? I18n.t("keyword_glossary.import_done")
          : I18n.t("keyword_glossary.import_skipped");
      await this.refreshEntries();
    } catch {
      this.error = I18n.t("keyword_glossary.errors.import_failed");
    }
  }
}

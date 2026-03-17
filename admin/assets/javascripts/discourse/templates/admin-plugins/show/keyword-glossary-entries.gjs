import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import DPageSubheader from "discourse/components/d-page-subheader";
import KeywordGlossaryMarkdownEditor from "discourse/components/keyword-glossary-markdown-editor";
import { i18n } from "discourse-i18n";

export default <template>
  <div class="admin-detail keyword-glossary-admin">
    <DPageSubheader @title={{i18n "keyword_glossary.manage_nav"}}>
      <:actions as |actions|>
        <actions.Primary
          @action={{@controller.startCreate}}
          @icon="plus"
          @label="keyword_glossary.new_entry"
        />
      </:actions>
    </DPageSubheader>

    {{#if @controller.notice}}
      <div class="alert alert-info">{{@controller.notice}}</div>
    {{/if}}

    {{#if @controller.error}}
      <div class="alert alert-error">{{@controller.error}}</div>
    {{/if}}

    <ConditionalLoadingSpinner @condition={{@controller.loading}} />

    <section class="keyword-glossary-admin__panel keyword-glossary-admin__list">
      <table class="d-table">
        <thead class="d-table__header">
          <tr>
            <th>{{i18n "keyword_glossary.term"}}</th>
            <th>{{i18n "keyword_glossary.aliases"}}</th>
            <th>{{i18n "keyword_glossary.feedback"}}</th>
            <th>{{i18n "keyword_glossary.enabled"}}</th>
            <th>{{i18n "keyword_glossary.actions"}}</th>
          </tr>
        </thead>
        <tbody>
          {{#each @controller.entries as |entry|}}
            <tr class="d-table__row">
              <td class="d-table__cell">
                <div class="keyword-glossary-admin__entry-head">
                  {{#if entry.logo_url}}
                    <img
                      class="keyword-glossary-admin__logo"
                      src={{entry.logo_url}}
                      alt={{entry.term}}
                    />
                  {{/if}}
                  <div>
                    <div class="keyword-glossary-admin__term">{{entry.term}}</div>
                    <div class="keyword-glossary-admin__description">
                      {{entry.description}}
                    </div>
                  </div>
                </div>
              </td>
              <td class="d-table__cell">
                {{#if entry.aliases.length}}
                  <div class="keyword-glossary-admin__aliases">
                    {{#each entry.aliases as |alias|}}
                      <span class="keyword-glossary-admin__alias">{{alias}}</span>
                    {{/each}}
                  </div>
                {{else}}
                  <span class="keyword-glossary-admin__muted">
                    {{i18n "keyword_glossary.no_aliases"}}
                  </span>
                {{/if}}
              </td>
              <td class="d-table__cell">
                <div class="keyword-glossary-admin__stats">
                  <span>👍 {{entry.upvotes_count}}</span>
                  <span>👎 {{entry.downvotes_count}}</span>
                </div>
              </td>
              <td class="d-table__cell">
                {{if entry.enabled (i18n "yes_value") (i18n "no_value")}}
              </td>
              <td class="d-table__cell">
                <div class="keyword-glossary-admin__actions">
                  <button
                    type="button"
                    class="btn btn-default btn-small"
                    {{on "click" (fn @controller.editEntry entry)}}
                  >
                    {{i18n "edit"}}
                  </button>
                  <button
                    type="button"
                    class="btn btn-default btn-small"
                    {{on "click" (fn @controller.toggleEntry entry)}}
                  >
                    {{if
                      entry.enabled
                      (i18n "keyword_glossary.disable")
                      (i18n "keyword_glossary.enable")
                    }}
                  </button>
                  <button
                    type="button"
                    class="btn btn-danger btn-small"
                    {{on "click" (fn @controller.deleteEntry entry)}}
                  >
                    {{i18n "keyword_glossary.delete"}}
                  </button>
                </div>
              </td>
            </tr>
          {{else}}
            <tr>
              <td class="d-table__cell" colspan="5">
                {{i18n "keyword_glossary.empty"}}
              </td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    </section>

    {{#if @controller.editorOpen}}
      <div class="keyword-glossary-admin__modal-backdrop" {{on "click" @controller.closeEditor}}></div>
      <section class="keyword-glossary-admin__modal">
        <div class="keyword-glossary-admin__modal-card">
          <div class="keyword-glossary-admin__modal-head">
            <div>
              <h2>
                {{if
                  @controller.isEditing
                  (i18n "keyword_glossary.edit_entry")
                  (i18n "keyword_glossary.new_entry")
                }}
              </h2>
              <div class="keyword-glossary-admin__muted">
                {{i18n "keyword_glossary.markdown_editor"}}
              </div>
            </div>
            <button
              type="button"
              class="btn btn-default"
              {{on "click" @controller.closeEditor}}
            >
              {{i18n "keyword_glossary.close_editor"}}
            </button>
          </div>

          <form class="keyword-glossary-admin__modal-body" {{on "submit" @controller.saveEntry}}>
            <div class="keyword-glossary-admin__modal-scroll">
              <div class="keyword-glossary-admin__form-grid">
              <label class="keyword-glossary-admin__field">
                <span>{{i18n "keyword_glossary.term"}}</span>
                <input
                  type="text"
                  value={{@controller.form.term}}
                  {{on "input" @controller.updateTerm}}
                />
              </label>

              <label class="keyword-glossary-admin__field">
                <span>{{i18n "keyword_glossary.link_url"}}</span>
                <input
                  type="url"
                  value={{@controller.form.link_url}}
                  {{on "input" @controller.updateLinkUrl}}
                />
              </label>

              <div class="keyword-glossary-admin__field">
                <span>{{i18n "keyword_glossary.logo_url"}}</span>
                <div class="keyword-glossary-admin__upload-row">
                  <label class="btn btn-default btn-small keyword-glossary-admin__upload-button">
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      {{on "change" @controller.uploadLogo}}
                    />
                    {{if
                      @controller.uploadingLogo
                      (i18n "keyword_glossary.uploading_logo")
                      (i18n "keyword_glossary.upload_logo")
                    }}
                  </label>
                  {{#if @controller.form.logo_url}}
                    <button
                      type="button"
                      class="btn btn-default btn-small"
                      {{on "click" @controller.clearLogo}}
                    >
                      {{i18n "keyword_glossary.clear_logo"}}
                    </button>
                  {{/if}}
                </div>
                {{#if @controller.form.logo_url}}
                  <div class="keyword-glossary-admin__logo-preview">
                    <img
                      class="keyword-glossary-admin__logo keyword-glossary-admin__logo--large"
                      src={{@controller.form.logo_url}}
                      alt={{@controller.form.term}}
                    />
                    <div class="keyword-glossary-admin__muted">
                      {{@controller.form.logo_url}}
                    </div>
                  </div>
                {{/if}}
                <small>{{i18n "keyword_glossary.logo_url_hint"}}</small>
              </div>

              <label class="keyword-glossary-admin__field">
                <span>{{i18n "keyword_glossary.aliases"}}</span>
                <textarea
                  rows="4"
                  {{on "input" @controller.updateAliases}}
                >{{@controller.form.aliasesText}}</textarea>
                <small>{{i18n "keyword_glossary.aliases_hint"}}</small>
              </label>
              </div>

              <div class="keyword-glossary-admin__markdown-layout">
                <div class="keyword-glossary-admin__field keyword-glossary-admin__field--full">
                  <span>{{i18n "keyword_glossary.description"}}</span>
                  <div class="keyword-glossary-admin__editor-shell">
                    <KeywordGlossaryMarkdownEditor
                      @value={{@controller.form.description}}
                      @change={{@controller.updateDescription}}
                    />
                  </div>
                </div>
              </div>

              <label class="keyword-glossary-admin__checkbox">
                <input
                  type="checkbox"
                  checked={{@controller.form.enabled}}
                  {{on "change" @controller.toggleFormEnabled}}
                />
                <span>{{i18n "keyword_glossary.enabled"}}</span>
              </label>
            </div>

            <div class="keyword-glossary-admin__form-actions">
              <button
                type="submit"
                class="btn btn-primary"
                disabled={{@controller.saving}}
              >
                {{if
                  @controller.isEditing
                  (i18n "keyword_glossary.update_entry")
                  (i18n "keyword_glossary.create_entry")
                }}
              </button>
              <button
                type="button"
                class="btn btn-default"
                {{on "click" @controller.closeEditor}}
              >
                {{i18n "keyword_glossary.cancel"}}
              </button>
            </div>
          </form>
        </div>
      </section>
    {{/if}}
  </div>
</template>

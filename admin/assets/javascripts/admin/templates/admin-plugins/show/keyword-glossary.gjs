import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import DPageSubheader from "discourse/components/d-page-subheader";
import { i18n } from "discourse-i18n";

export default <template>
  <div class="admin-detail keyword-glossary-admin">
    <DPageSubheader @titleLabel={{i18n "keyword_glossary.title"}}>
      <:actions as |actions|>
        <actions.Primary
          @action={{@controller.startCreate}}
          @icon="plus"
          @label="keyword_glossary.new_entry"
        />
        {{#if @controller.hasLegacyImport}}
          <actions.Wrapped>
            <button
              type="button"
              class="btn btn-default"
              {{on "click" @controller.importLegacy}}
            >
              {{i18n "keyword_glossary.import_legacy"}}
            </button>
          </actions.Wrapped>
        {{/if}}
      </:actions>
    </DPageSubheader>

    {{#if @controller.notice}}
      <div class="alert alert-info">{{@controller.notice}}</div>
    {{/if}}

    {{#if @controller.error}}
      <div class="alert alert-error">{{@controller.error}}</div>
    {{/if}}

    {{#if @controller.hasLegacyImport}}
      <div class="alert alert-info">{{i18n "keyword_glossary.legacy_ready"}}</div>
    {{/if}}

    <ConditionalLoadingSpinner @condition={{@controller.loading}} />

    <div class="keyword-glossary-admin__grid">
      <section class="keyword-glossary-admin__panel keyword-glossary-admin__list">
        <table class="d-table">
          <thead class="d-table__header">
            <tr>
              <th>{{i18n "keyword_glossary.term"}}</th>
              <th>{{i18n "keyword_glossary.aliases"}}</th>
              <th>{{i18n "keyword_glossary.enabled"}}</th>
              <th>{{i18n "keyword_glossary.actions"}}</th>
            </tr>
          </thead>
          <tbody>
            {{#each @controller.entries as |entry|}}
              <tr class="d-table__row">
                <td class="d-table__cell">
                  <div class="keyword-glossary-admin__term">{{entry.term}}</div>
                  <div class="keyword-glossary-admin__description">
                    {{entry.description}}
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
                    -
                  {{/if}}
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
                <td class="d-table__cell" colspan="4">
                  {{i18n "keyword_glossary.empty"}}
                </td>
              </tr>
            {{/each}}
          </tbody>
        </table>
      </section>

      <section class="keyword-glossary-admin__panel keyword-glossary-admin__editor">
        <h2>
          {{if
            @controller.isEditing
            (i18n "keyword_glossary.edit_entry")
            (i18n "keyword_glossary.new_entry")
          }}
        </h2>

        <form {{on "submit" @controller.saveEntry}}>
          <label class="keyword-glossary-admin__field">
            <span>{{i18n "keyword_glossary.term"}}</span>
            <input
              type="text"
              value={{@controller.form.term}}
              {{on "input" @controller.updateTerm}}
            />
          </label>

          <label class="keyword-glossary-admin__field">
            <span>{{i18n "keyword_glossary.aliases"}}</span>
            <textarea
              rows="5"
              {{on "input" @controller.updateAliases}}
            >{{@controller.form.aliasesText}}</textarea>
            <small>{{i18n "keyword_glossary.aliases_hint"}}</small>
          </label>

          <label class="keyword-glossary-admin__field">
            <span>{{i18n "keyword_glossary.description"}}</span>
            <textarea
              rows="6"
              {{on "input" @controller.updateDescription}}
            >{{@controller.form.description}}</textarea>
          </label>

          <label class="keyword-glossary-admin__field">
            <span>{{i18n "keyword_glossary.link_url"}}</span>
            <input
              type="url"
              value={{@controller.form.link_url}}
              {{on "input" @controller.updateLinkUrl}}
            />
          </label>

          <label class="keyword-glossary-admin__checkbox">
            <input
              type="checkbox"
              checked={{@controller.form.enabled}}
              {{on "change" @controller.toggleFormEnabled}}
            />
            <span>{{i18n "keyword_glossary.enabled"}}</span>
          </label>

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
              {{on "click" @controller.cancelEdit}}
            >
              {{i18n "keyword_glossary.cancel"}}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

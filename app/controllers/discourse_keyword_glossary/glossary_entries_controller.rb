# frozen_string_literal: true

module DiscourseKeywordGlossary
  class GlossaryEntriesController < ::ApplicationController
    requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

    skip_before_action :check_xhr, only: [:index]

    def index
      return render_json_dump(entries: []) if !SiteSetting.keyword_glossary_enabled

      LegacyImporter.import_if_needed!

      entries = GlossaryEntry.enabled_entries.ordered
      render_json_dump(
        entries:
          ActiveModel::ArraySerializer.new(
            entries,
            each_serializer: PublicGlossaryEntrySerializer,
          ).as_json,
      )
    end
  end
end

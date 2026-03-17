# frozen_string_literal: true

module DiscourseKeywordGlossary
  class GlossaryEntriesController < ::ApplicationController
    requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

    skip_before_action :check_xhr, only: [:index]

    def index
      return render_json_dump(entries: []) if !SiteSetting.keyword_glossary_enabled

      entries = GlossaryEntry.enabled_entries.ordered
      votes = load_votes(entries)

      render_json_dump(
        entries:
          ActiveModel::ArraySerializer.new(
            entries,
            each_serializer: PublicGlossaryEntrySerializer,
            scope: {
              votes_by_entry_id: votes.each_with_object({}) { |vote, map| map[vote.glossary_entry_id] = vote.value },
            },
          ).as_json,
      )
    end

    private

    def load_votes(entries)
      return GlossaryVote.none if entries.blank? || !current_user

      GlossaryVote.where(glossary_entry_id: entries.pluck(:id), user_id: current_user.id)
    end
  end
end

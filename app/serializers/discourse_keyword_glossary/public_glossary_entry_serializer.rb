# frozen_string_literal: true

module DiscourseKeywordGlossary
  class PublicGlossaryEntrySerializer < ActiveModel::Serializer
    attributes :id,
               :term,
               :aliases,
               :description,
               :description_cooked,
               :link_url,
               :logo_url,
               :upvotes_count,
               :downvotes_count,
               :corrections_count,
               :current_vote

    def description_cooked
      PrettyText.cook(object.description.to_s)
    end

    def current_vote
      scope&.dig(:votes_by_entry_id, object.id)
    end
  end
end

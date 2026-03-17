# frozen_string_literal: true

module DiscourseKeywordGlossary
  class AdminGlossaryEntrySerializer < ActiveModel::Serializer
    attributes :id,
               :term,
               :aliases,
               :description,
               :description_cooked,
               :link_url,
               :logo_url,
               :enabled,
               :upvotes_count,
               :downvotes_count,
               :corrections_count,
               :created_at,
               :updated_at

    def description_cooked
      PrettyText.cook(object.description.to_s)
    end
  end
end

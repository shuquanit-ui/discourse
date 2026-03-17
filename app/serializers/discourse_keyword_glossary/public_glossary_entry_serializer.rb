# frozen_string_literal: true

module DiscourseKeywordGlossary
  class PublicGlossaryEntrySerializer < ActiveModel::Serializer
    attributes :id, :term, :aliases, :description, :description_cooked, :link_url

    def description_cooked
      PrettyText.cook(object.description.to_s)
    end
  end
end

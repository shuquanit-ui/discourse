# frozen_string_literal: true

module DiscourseKeywordGlossary
  class PublicGlossaryEntrySerializer < ActiveModel::Serializer
    attributes :id, :term, :aliases, :description, :link_url
  end
end

# frozen_string_literal: true

module DiscourseKeywordGlossary
  class AdminGlossaryEntrySerializer < ActiveModel::Serializer
    attributes :id, :term, :aliases, :description, :link_url, :enabled, :created_at, :updated_at
  end
end

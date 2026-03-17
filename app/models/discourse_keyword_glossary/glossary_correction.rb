# frozen_string_literal: true

module DiscourseKeywordGlossary
  class GlossaryCorrection < ActiveRecord::Base
    self.table_name = "keyword_glossary_corrections"

    STATUSES = %w[pending reviewed ignored].freeze

    belongs_to :entry,
               class_name: "DiscourseKeywordGlossary::GlossaryEntry",
               foreign_key: :glossary_entry_id
    belongs_to :user, optional: true

    validates :content, presence: true
    validates :status, inclusion: { in: STATUSES }
  end
end

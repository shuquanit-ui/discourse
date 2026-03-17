# frozen_string_literal: true

module DiscourseKeywordGlossary
  class GlossaryVote < ActiveRecord::Base
    self.table_name = "keyword_glossary_votes"

    belongs_to :entry,
               class_name: "DiscourseKeywordGlossary::GlossaryEntry",
               foreign_key: :glossary_entry_id
    belongs_to :user, optional: true

    validates :value, inclusion: { in: [-1, 1] }
    validates :session_key, presence: true, unless: :user_id?
  end
end

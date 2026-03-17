# frozen_string_literal: true

module DiscourseKeywordGlossary
  class GlossaryEntry < ActiveRecord::Base
    self.table_name = "keyword_glossary_entries"

    scope :enabled_entries, -> { where(enabled: true) }
    scope :ordered, -> { order(Arel.sql("lower(term) asc")) }

    has_many :votes,
             class_name: "DiscourseKeywordGlossary::GlossaryVote",
             foreign_key: :glossary_entry_id,
             dependent: :destroy

    validates :term, presence: true, uniqueness: { case_sensitive: false }
    validates :description, presence: true
    validates :logo_url, length: { maximum: 1000 }, allow_blank: true
    validate :aliases_are_distinct

    before_validation :normalize_fields

    def aliases
      value = self[:aliases]
      Array(value).compact.map(&:to_s)
    end

    def aliases=(value)
      self[:aliases] =
        Array(value)
          .flat_map { |item| item.is_a?(String) ? item.split(/[\n,]/) : item }
          .compact
          .map(&:to_s)
    end

    def all_terms
      ([term] + aliases).map(&:to_s).map(&:strip).reject(&:blank?).uniq
    end

    private

    def normalize_fields
      self.term = term.to_s.strip
      self.description = description.to_s.strip
      self.link_url = link_url.to_s.strip.presence
      self.logo_url = logo_url.to_s.strip.presence
      self[:aliases] =
        aliases
          .map(&:strip)
          .reject(&:blank?)
          .reject { |item| item.casecmp?(term.to_s.strip) }
          .uniq(&:downcase)
    end

    def aliases_are_distinct
      return if term.blank?

      return unless aliases.any? { |item| item.casecmp?(term) }

      errors.add(:aliases, I18n.t("keyword_glossary.errors.alias_matches_term"))
    end
  end
end

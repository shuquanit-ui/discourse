# frozen_string_literal: true

module DiscourseKeywordGlossary
  class LegacyImporter
    STORE_KEY = "legacy_entries_imported_at"

    def self.import_if_needed!
      return { imported: 0, skipped: true } if PluginStore.get(PLUGIN_NAME, STORE_KEY).present?

      if GlossaryEntry.exists?
        PluginStore.set(PLUGIN_NAME, STORE_KEY, Time.zone.now.iso8601)
        return { imported: 0, skipped: true }
      end

      raw_entries = normalize_legacy_entries(SiteSetting.keyword_glossary_entries)
      return { imported: 0, skipped: true } if raw_entries.blank?

      imported = 0

      GlossaryEntry.transaction do
        raw_entries.each do |line|
          term, description, link_url = line.split("|", 3).map { |value| value.to_s.strip }
          next if term.blank? || description.blank? || link_url.to_s.include?("|")

          GlossaryEntry.create!(
            term: term,
            description: description,
            link_url: link_url.presence,
            aliases: [],
            enabled: true,
          )
          imported += 1
        end

        PluginStore.set(PLUGIN_NAME, STORE_KEY, Time.zone.now.iso8601)
      end

      { imported: imported, skipped: false }
    end

    def self.status
      {
        imported_at: PluginStore.get(PLUGIN_NAME, STORE_KEY),
        has_legacy_entries: normalize_legacy_entries(SiteSetting.keyword_glossary_entries).present?,
      }
    end

    def self.import_now!
      result = import_if_needed!
      status.merge(result)
    end

    def self.normalize_legacy_entries(value)
      items = value.is_a?(Array) ? value : value.to_s.split("\n")
      items
        .map(&:to_s)
        .map(&:strip)
        .reject(&:blank?)
        .select { |line| line.count("|") >= 2 }
    end
  end
end

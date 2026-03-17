# frozen_string_literal: true

require "json"
require "yaml"

module DiscourseKeywordGlossary
  module Admin
    class GlossaryEntriesController < ::Admin::AdminController
      requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

      before_action :ensure_entry, only: %i[update destroy]

      def index
        imported_count = import_legacy_entries_if_needed
        entries = GlossaryEntry.ordered

        render_json_dump(
          imported_count: imported_count,
          entries:
            ActiveModel::ArraySerializer.new(
              entries,
              each_serializer: AdminGlossaryEntrySerializer,
            ).as_json,
        )
      end

      def create
        entry = GlossaryEntry.create!(entry_params)
        render_json_dump(entry: serialize_entry(entry))
      rescue ActiveRecord::RecordInvalid => e
        render_json_error(e.record.errors.full_messages.join("\n"))
      end

      def update
        @entry.update!(entry_params)
        render_json_dump(entry: serialize_entry(@entry))
      rescue ActiveRecord::RecordInvalid => e
        render_json_error(e.record.errors.full_messages.join("\n"))
      end

      def destroy
        @entry.destroy!
        render_json_dump(success: true)
      end

      def preview
        render_json_dump(cooked: PrettyText.cook(params[:raw].to_s))
      end

      private

      def ensure_entry
        @entry = GlossaryEntry.find(params[:id])
      end

      def entry_params
        params.require(:entry).permit(:term, :description, :link_url, :logo_url, :enabled, aliases: [])
      end

      def serialize_entry(entry)
        AdminGlossaryEntrySerializer.new(entry, root: false).as_json
      end

      def import_legacy_entries_if_needed
        return 0 if GlossaryEntry.exists?

        raw_value =
          DB.query_single(
            "SELECT value FROM site_settings WHERE name = 'keyword_glossary_entries' LIMIT 1",
          ).first

        return 0 if raw_value.blank?

        parse_legacy_entries(raw_value).count do |attrs|
          next false if attrs[:term].blank? || attrs[:description].blank?

          entry = GlossaryEntry.new(attrs)
          entry.save
        end
      end

      def parse_legacy_entries(raw_value)
        parsed = parse_legacy_payload(raw_value)
        items = parsed.is_a?(Array) ? parsed : raw_value.to_s.lines.map(&:strip).reject(&:blank?)

        items.filter_map do |item|
          normalize_legacy_entry(item)
        end
      end

      def parse_legacy_payload(raw_value)
        JSON.parse(raw_value)
      rescue JSON::ParserError
        YAML.safe_load(raw_value, aliases: true)
      rescue Psych::SyntaxError, Psych::DisallowedClass
        nil
      end

      def normalize_legacy_entry(item)
        case item
        when Hash
          {
            term: item["term"] || item[:term] || item["name"] || item[:name] || item["keyword"] || item[:keyword],
            aliases: normalize_legacy_aliases(item["aliases"] || item[:aliases] || item["alias"] || item[:alias]),
            description:
              item["description"] || item[:description] || item["body"] || item[:body] || item["content"] || item[:content],
            link_url: item["link_url"] || item[:link_url] || item["url"] || item[:url] || item["link"] || item[:link],
            logo_url: item["logo_url"] || item[:logo_url],
            enabled: item.key?("enabled") ? item["enabled"] : (item.key?(:enabled) ? item[:enabled] : true),
          }
        when String
          parts = item.split("|", 3).map(&:strip)
          return nil if parts[0].blank? || parts[1].blank?

          {
            term: parts[0],
            aliases: [],
            description: parts[1],
            link_url: parts[2].presence,
            enabled: true,
          }
        end
      end

      def normalize_legacy_aliases(value)
        Array(value)
          .flat_map { |item| item.is_a?(String) ? item.split(/[\n,|]/) : item }
          .compact
          .map(&:to_s)
          .map(&:strip)
          .reject(&:blank?)
      end
    end
  end
end

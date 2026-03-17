# frozen_string_literal: true

module DiscourseKeywordGlossary
  module Admin
    class GlossaryEntriesController < ::Admin::AdminController
      requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

      before_action :ensure_entry, only: %i[update destroy]

      def index
        LegacyImporter.import_if_needed!

        entries = GlossaryEntry.ordered

        render_json_dump(
          entries:
            ActiveModel::ArraySerializer.new(
              entries,
              each_serializer: AdminGlossaryEntrySerializer,
            ).as_json,
          meta: LegacyImporter.status,
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

      def import_legacy
        render_json_dump(meta: LegacyImporter.import_now!)
      rescue ActiveRecord::RecordInvalid => e
        render_json_error(e.record.errors.full_messages.join("\n"))
      end

      private

      def ensure_entry
        @entry = GlossaryEntry.find(params[:id])
      end

      def entry_params
        params.require(:entry).permit(:term, :description, :link_url, :enabled, aliases: [])
      end

      def serialize_entry(entry)
        AdminGlossaryEntrySerializer.new(entry, root: false).as_json
      end
    end
  end
end

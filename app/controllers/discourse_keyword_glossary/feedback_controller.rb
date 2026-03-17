# frozen_string_literal: true

module DiscourseKeywordGlossary
  class FeedbackController < ::ApplicationController
    requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

    before_action :ensure_entry

    def vote
      value = params.require(:value).to_i
      raise Discourse::InvalidParameters.new(:value) if ![-1, 1].include?(value)

      vote = find_vote

      ActiveRecord::Base.transaction do
        if vote&.value == value
          vote.destroy!
        elsif vote
          vote.update!(value: value)
        else
          @entry.votes.create!(
            user: current_user,
            session_key: current_user ? nil : session_key,
            value: value,
          )
        end

        refresh_counts!
      end

      render_json_dump(
        upvotes_count: @entry.upvotes_count,
        downvotes_count: @entry.downvotes_count,
        current_vote: current_vote,
      )
    end

    def correction
      correction =
        @entry.corrections.create!(
          user: current_user,
          content: params.require(:content).to_s.strip,
        )

      refresh_counts!

      render_json_dump(
        success: true,
        correction_id: correction.id,
        corrections_count: @entry.corrections_count,
      )
    rescue ActiveRecord::RecordInvalid => e
      render_json_error(e.record.errors.full_messages.join("\n"))
    end

    private

    def ensure_entry
      @entry = GlossaryEntry.find(params[:id])
    end

    def session_key
      session.id.to_s.presence || request.session_options[:id].to_s.presence
    end

    def find_vote
      if current_user
        @entry.votes.find_by(user_id: current_user.id)
      else
        @entry.votes.find_by(session_key: session_key)
      end
    end

    def current_vote
      find_vote&.value
    end

    def refresh_counts!
      @entry.update_columns(
        upvotes_count: @entry.votes.where(value: 1).count,
        downvotes_count: @entry.votes.where(value: -1).count,
        corrections_count: @entry.corrections.count,
      )
      @entry.reload
    end
  end
end

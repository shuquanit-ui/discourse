# frozen_string_literal: true

module DiscourseKeywordGlossary
  class FeedbackController < ::ApplicationController
    requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

    before_action :ensure_entry
    before_action :ensure_logged_in, only: :vote

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
            session_key: nil,
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

    private

    def ensure_entry
      @entry = GlossaryEntry.find(params[:id])
    end

    def session_key
      session.id.to_s.presence || request.session_options[:id].to_s.presence
    end

    def find_vote
      @entry.votes.find_by(user_id: current_user.id)
    end

    def current_vote
      find_vote&.value
    end

    def refresh_counts!
      @entry.update_columns(
        upvotes_count: @entry.votes.where(value: 1).count,
        downvotes_count: @entry.votes.where(value: -1).count,
      )
      @entry.reload
    end
  end
end

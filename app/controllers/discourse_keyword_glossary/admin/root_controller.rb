# frozen_string_literal: true

module DiscourseKeywordGlossary
  module Admin
    class RootController < ::Admin::AdminController
      requires_plugin DiscourseKeywordGlossary::PLUGIN_NAME

      def show
        redirect_to "/admin/plugins/keyword-glossary/entries"
      end
    end
  end
end

# frozen_string_literal: true

# name: discourse-keyword-glossary
# about: Manage glossary entries in admin and show keyword popups in posts.
# version: 0.2.0
# authors: quria
# url: https://github.com/shuquanit-ui/discourse.git

enabled_site_setting :keyword_glossary_enabled

register_asset "stylesheets/common/keyword-glossary.scss"
register_svg_icon "book-open"

add_admin_route "keyword_glossary.title", "keyword-glossary", use_new_show_route: true

module ::DiscourseKeywordGlossary
  PLUGIN_NAME = "discourse-keyword-glossary"
end

require_relative "lib/discourse_keyword_glossary/engine"

after_initialize do
  require_relative "app/models/discourse_keyword_glossary/glossary_entry"
  require_relative "app/models/discourse_keyword_glossary/glossary_vote"
  require_relative "app/serializers/discourse_keyword_glossary/admin_glossary_entry_serializer"
  require_relative "app/serializers/discourse_keyword_glossary/public_glossary_entry_serializer"
  require_relative "lib/discourse_keyword_glossary/legacy_importer"
  require_relative "app/controllers/discourse_keyword_glossary/glossary_entries_controller"
  require_relative "app/controllers/discourse_keyword_glossary/feedback_controller"
  require_relative "app/controllers/discourse_keyword_glossary/admin/glossary_entries_controller"
end

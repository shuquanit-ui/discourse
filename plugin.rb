# frozen_string_literal: true

# name: discourse-keyword-glossary
# about: Click keywords in posts to show glossary entries.
# version: 0.1.0
# authors: quria
# url: https://github.com/your-org/discourse-keyword-glossary

enabled_site_setting :keyword_glossary_enabled

register_asset "stylesheets/common/keyword-glossary.scss"

after_initialize do
  # frontend-only plugin
end

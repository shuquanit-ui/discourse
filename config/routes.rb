# frozen_string_literal: true

DiscourseKeywordGlossary::Engine.routes.draw do
  scope "/", defaults: { format: :json } do
    get "entries" => "admin/glossary_entries#index"
    post "entries" => "admin/glossary_entries#create"
    put "entries/:id" => "admin/glossary_entries#update"
    delete "entries/:id" => "admin/glossary_entries#destroy"
    post "import-legacy" => "admin/glossary_entries#import_legacy"
  end
end

Discourse::Application.routes.draw do
  mount ::DiscourseKeywordGlossary::Engine, at: "/admin/plugins/keyword-glossary"

  scope "/", defaults: { format: :json } do
    get "/keyword-glossary/entries" => "discourse_keyword_glossary/glossary_entries#index"
  end
end

# frozen_string_literal: true

DiscourseKeywordGlossary::Engine.routes.draw do
  scope "/", defaults: { format: :json } do
    get "entries" => "admin/glossary_entries#index"
    post "entries" => "admin/glossary_entries#create"
    put "entries/:id" => "admin/glossary_entries#update"
    delete "entries/:id" => "admin/glossary_entries#destroy"
    post "preview" => "admin/glossary_entries#preview"
  end
end

Discourse::Application.routes.draw do
  get "/admin/plugins/keyword-glossary" =>
        "admin/plugins#show",
      defaults: {
        plugin_id: "keyword-glossary",
      },
      constraints: lambda { |req| req.format.html? }

  get "/admin/plugins/keyword-glossary/entries" =>
        "admin/plugins#show",
      defaults: {
        plugin_id: "keyword-glossary",
      },
      constraints: lambda { |req| req.format.html? }

  mount ::DiscourseKeywordGlossary::Engine, at: "/admin/plugins/keyword-glossary"

  scope "/", defaults: { format: :json } do
    get "/keyword-glossary/entries" => "discourse_keyword_glossary/glossary_entries#index"
    post "/keyword-glossary/entries/:id/vote" => "discourse_keyword_glossary/feedback#vote"
  end
end

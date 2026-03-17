# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Discourse Keyword Glossary" do
  fab!(:admin) { Fabricate(:admin) }

  before { SiteSetting.keyword_glossary_enabled = true }

  describe "GET /keyword-glossary/entries.json" do
    it "returns enabled public entries" do
      DiscourseKeywordGlossary::GlossaryEntry.create!(
        term: "RAG",
        aliases: ["Retrieval"],
        description: "Retrieval augmented generation",
        enabled: true,
      )

      DiscourseKeywordGlossary::GlossaryEntry.create!(
        term: "Disabled",
        aliases: [],
        description: "Should not be returned",
        enabled: false,
      )

      get "/keyword-glossary/entries.json"

      expect(response.status).to eq(200)
      expect(response.parsed_body["entries"].map { |entry| entry["term"] }).to eq(["RAG"])
    end
  end

  describe "admin CRUD" do
    before { sign_in(admin) }

    it "creates an entry" do
      post "/admin/plugins/discourse-keyword-glossary/api/entries.json",
           params: {
             entry: {
               term: "Embedding",
               aliases: %w[vectorization vectors],
               description: "Convert text into vectors",
               link_url: "https://quria.me",
               enabled: true,
             },
           }

      expect(response.status).to eq(200)
      expect(DiscourseKeywordGlossary::GlossaryEntry.last.term).to eq("Embedding")
      expect(DiscourseKeywordGlossary::GlossaryEntry.last.aliases).to eq(
        %w[vectorization vectors],
      )
    end
  end

  describe "POST /keyword-glossary/entries/:id/vote" do
    let!(:entry) do
      DiscourseKeywordGlossary::GlossaryEntry.create!(
        term: "RAG",
        aliases: ["Retrieval"],
        description: "Retrieval augmented generation",
        enabled: true,
      )
    end

    it "rejects guests" do
      post "/keyword-glossary/entries/#{entry.id}/vote", params: { value: 1 }

      expect(response.status).to eq(403)
    end

    it "allows signed-in users" do
      sign_in(admin)

      post "/keyword-glossary/entries/#{entry.id}/vote", params: { value: 1 }

      expect(response.status).to eq(200)
      expect(response.parsed_body["upvotes_count"]).to eq(1)
    end
  end
end

# frozen_string_literal: true

require "rails_helper"

RSpec.describe DiscourseKeywordGlossary::GlossaryEntry do
  describe "normalization" do
    it "normalizes aliases and removes duplicates" do
      entry =
        described_class.create!(
          term: "RAG",
          aliases: [" Retrieval ", "RAG", "retrieval", ""],
          description: "Retrieval augmented generation",
          enabled: true,
        )

      expect(entry.aliases).to eq(["Retrieval"])
      expect(entry.all_terms).to eq(%w[RAG Retrieval])
    end
  end
end

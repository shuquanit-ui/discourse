# frozen_string_literal: true

class CreateKeywordGlossaryEntries < ActiveRecord::Migration[7.2]
  def change
    create_table :keyword_glossary_entries do |t|
      t.string :term, null: false
      t.jsonb :aliases, null: false, default: []
      t.text :description, null: false
      t.string :link_url
      t.boolean :enabled, null: false, default: true

      t.timestamps
    end

    add_index :keyword_glossary_entries, "lower(term)", unique: true, name: "idx_keyword_glossary_entries_lower_term"
    add_index :keyword_glossary_entries, :enabled
  end
end

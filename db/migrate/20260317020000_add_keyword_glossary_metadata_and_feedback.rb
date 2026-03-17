# frozen_string_literal: true

class AddKeywordGlossaryMetadataAndFeedback < ActiveRecord::Migration[7.2]
  def change
    change_table :keyword_glossary_entries do |t|
      t.string :logo_url
      t.integer :upvotes_count, null: false, default: 0
      t.integer :downvotes_count, null: false, default: 0
      t.integer :corrections_count, null: false, default: 0
    end

    create_table :keyword_glossary_votes do |t|
      t.integer :glossary_entry_id, null: false
      t.integer :user_id
      t.string :session_key
      t.integer :value, null: false

      t.timestamps
    end

    add_index :keyword_glossary_votes, :glossary_entry_id
    add_index :keyword_glossary_votes, :user_id
    add_index :keyword_glossary_votes, :session_key
    add_index :keyword_glossary_votes,
              [:glossary_entry_id, :user_id],
              unique: true,
              where: "user_id IS NOT NULL",
              name: "idx_keyword_glossary_votes_user_unique"
    add_index :keyword_glossary_votes,
              [:glossary_entry_id, :session_key],
              unique: true,
              where: "session_key IS NOT NULL",
              name: "idx_keyword_glossary_votes_session_unique"

    create_table :keyword_glossary_corrections do |t|
      t.integer :glossary_entry_id, null: false
      t.integer :user_id
      t.text :content, null: false
      t.string :status, null: false, default: "pending"

      t.timestamps
    end

    add_index :keyword_glossary_corrections, :glossary_entry_id
    add_index :keyword_glossary_corrections, :user_id
    add_index :keyword_glossary_corrections, :status
  end
end

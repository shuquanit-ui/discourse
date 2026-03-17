# frozen_string_literal: true

class RemoveKeywordGlossaryCorrections < ActiveRecord::Migration[7.1]
  def up
    remove_column :keyword_glossary_entries, :corrections_count, :integer if column_exists?(:keyword_glossary_entries, :corrections_count)
    drop_table :keyword_glossary_corrections if table_exists?(:keyword_glossary_corrections)
  end

  def down
    add_column :keyword_glossary_entries, :corrections_count, :integer, default: 0, null: false unless column_exists?(:keyword_glossary_entries, :corrections_count)

    return if table_exists?(:keyword_glossary_corrections)

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

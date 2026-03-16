# discourse-keyword-glossary

Discourse plugin: click (or hover) keywords inside post content to show glossary popups.

## Features

- Auto-detect keywords in cooked post content
- Popup with `term + description + optional link`
- Site setting driven, no code change needed
- Trigger mode: `click` or `hover`

## Install

Add this repo to your Discourse container:

```yml
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - git clone https://github.com/<your-org>/discourse-keyword-glossary.git
```

Rebuild:

```bash
cd /var/discourse
./launcher rebuild app
```

Do not hot-copy this plugin into a running container and only restart `unicorn`.
Install it through `app.yml` + full rebuild so plugin assets are compiled and registered correctly.

## Settings

Admin -> Settings -> search `keyword_glossary`

- `keyword_glossary_enabled`
- `keyword_glossary_entries`
- `keyword_glossary_trigger`
- `keyword_glossary_max_width`

`keyword_glossary_entries` format (one line per entry):

```text
关键词|词条说明|https://example.com/detail
RAG|Retrieval-Augmented Generation，先检索再生成。|https://example.com/rag
```

`url` is optional:

```text
Embedding|把文本转向量表示，便于相似度检索。|
```

## Notes

- The plugin skips replacements inside `a/code/pre/script/style/button/textarea/input`.
- Matching is plain keyword match and is case-insensitive for Latin text.

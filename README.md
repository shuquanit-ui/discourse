# discourse-keyword-glossary

[中文](#中文说明) | [English](#english)

A Discourse plugin for managing glossary entries in admin and showing keyword popups inside post content.

## 中文说明

### 简介

`discourse-keyword-glossary` 是一个 Discourse 插件，用来给论坛里的关键词增加词条解释能力。

管理员可以在后台维护词条，前台用户在帖子正文里点击命中的关键词后，会看到词条弹窗。

### 当前功能

- 后台词条管理页
- 词条增删改查
- 支持启用/停用词条
- 支持别名
- 支持 Logo
- 支持 Markdown 说明内容
- 前台关键词点击弹窗
- 可选详情链接
- 桌面端和移动端不同弹窗布局

### 后台入口

- 插件设置页:
  - `/admin/plugins/discourse-keyword-glossary/settings`
- 词条管理页:
  - `/admin/plugins/discourse-keyword-glossary/entries`

### 安装

把仓库加入 Discourse 容器配置，例如在 `app.yml` 中：

```yml
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - git clone https://github.com/shuquanit-ui/discourse.git discourse-keyword-glossary
```

然后完整重建容器：

```bash
cd /var/discourse
./launcher rebuild app
```

不要把插件直接热拷贝进运行中的容器后只重启 `unicorn`。  
标准做法仍然是：修改 `app.yml` 后完整 `rebuild`。

### 设置项

后台搜索 `keyword_glossary`：

- `keyword_glossary_enabled`
- `keyword_glossary_trigger`
- `keyword_glossary_max_width`
- `keyword_glossary_entries`

说明：

- `keyword_glossary_entries` 现在只作为旧版导入源保留，不再是主要维护方式
- 新词条应在后台词条管理页维护

### 兼容说明

- 不会替换这些节点中的内容：
  - `a`
  - `code`
  - `pre`
  - `script`
  - `style`
  - `button`
  - `textarea`
  - `input`
- 拉丁文本匹配默认大小写不敏感

### 当前状态

这个插件目前更适合作为自用或 Beta 阶段项目继续打磨，还没有按 Discourse 官方插件发布标准做完完整收敛。

---

## English

### Overview

`discourse-keyword-glossary` is a Discourse plugin that adds glossary-style keyword explanations to forum content.

Admins manage glossary entries from the admin panel, and users can click matched keywords in cooked post content to open a glossary popup.

### Current Features

- Admin glossary management page
- Create, edit, delete glossary entries
- Enable/disable entries
- Alias support
- Logo support
- Markdown descriptions
- Frontend click-to-open keyword popup
- Optional detail link
- Different drawer layouts for desktop and mobile

### Admin Routes

- Plugin settings page:
  - `/admin/plugins/discourse-keyword-glossary/settings`
- Glossary management page:
  - `/admin/plugins/discourse-keyword-glossary/entries`

### Installation

Add the repository to your Discourse container configuration, for example in `app.yml`:

```yml
hooks:
  after_code:
    - exec:
        cd: $home/plugins
        cmd:
          - git clone https://github.com/shuquanit-ui/discourse.git discourse-keyword-glossary
```

Then rebuild the container:

```bash
cd /var/discourse
./launcher rebuild app
```

Do not hot-copy this plugin into a running container and only restart `unicorn`.  
The supported setup is still: update `app.yml`, then do a full rebuild.

### Settings

Search for `keyword_glossary` in admin settings:

- `keyword_glossary_enabled`
- `keyword_glossary_trigger`
- `keyword_glossary_max_width`
- `keyword_glossary_entries`

Notes:

- `keyword_glossary_entries` is now kept only as a legacy import source
- New entries should be managed from the admin glossary page

### Compatibility Notes

- The plugin skips replacements inside:
  - `a`
  - `code`
  - `pre`
  - `script`
  - `style`
  - `button`
  - `textarea`
  - `input`
- Matching is case-insensitive for Latin text

### Status

This plugin is currently better suited for self-hosted or beta usage and has not yet been fully polished for an official Discourse plugin submission.

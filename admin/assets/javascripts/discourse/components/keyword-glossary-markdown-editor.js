import Component from "@glimmer/component";
import { action } from "@ember/object";
import { i18n } from "discourse-i18n";

const EASYMDE_CSS_ID = "keyword-glossary-easymde-css";
const EASYMDE_SCRIPT_ID = "keyword-glossary-easymde-script";

let easyMdePromise = null;

function ensureEasyMde() {
  if (window.EasyMDE) {
    return Promise.resolve(window.EasyMDE);
  }

  if (easyMdePromise) {
    return easyMdePromise;
  }

  easyMdePromise = new Promise((resolve, reject) => {
    if (!document.getElementById(EASYMDE_CSS_ID)) {
      const link = document.createElement("link");
      link.id = EASYMDE_CSS_ID;
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/easymde@2.18.0/dist/easymde.min.css";
      document.head.appendChild(link);
    }

    const existingScript = document.getElementById(EASYMDE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.EasyMDE), {
        once: true,
      });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = EASYMDE_SCRIPT_ID;
    script.src =
      "https://cdn.jsdelivr.net/npm/easymde@2.18.0/dist/easymde.min.js";
    script.async = true;
    script.onload = () => resolve(window.EasyMDE);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return easyMdePromise;
}

export default class KeywordGlossaryMarkdownEditor extends Component {
  editor = null;
  lastValue = null;

  get toolbar() {
    const EasyMDE = window.EasyMDE;

    return [
      {
        name: "bold",
        action: EasyMDE.toggleBold,
        className: "kg-easymde-bold",
        title: i18n("js.composer.bold_label"),
      },
      {
        name: "italic",
        action: EasyMDE.toggleItalic,
        className: "kg-easymde-italic",
        title: i18n("js.composer.italic_label"),
      },
      {
        name: "heading",
        action: EasyMDE.toggleHeadingSmaller,
        className: "kg-easymde-heading",
        title: i18n("js.composer.heading_label"),
      },
      "|",
      {
        name: "quote",
        action: EasyMDE.toggleBlockquote,
        className: "kg-easymde-quote",
        title: i18n("js.composer.blockquote_label"),
      },
      {
        name: "code",
        action: EasyMDE.toggleCodeBlock,
        className: "kg-easymde-code",
        title: i18n("js.composer.code_text"),
      },
      {
        name: "unordered-list",
        action: EasyMDE.toggleUnorderedList,
        className: "kg-easymde-list",
        title: i18n("js.composer.ulist_title"),
      },
      {
        name: "ordered-list",
        action: EasyMDE.toggleOrderedList,
        className: "kg-easymde-olist",
        title: i18n("js.composer.olist_title"),
      },
      {
        name: "link",
        action: EasyMDE.drawLink,
        className: "kg-easymde-link",
        title: i18n("js.composer.link_title"),
      },
      "|",
      {
        name: "preview",
        action: EasyMDE.togglePreview,
        className: "kg-easymde-preview",
        title: i18n("keyword_glossary.markdown_preview"),
      },
      {
        name: "side-by-side",
        action: EasyMDE.toggleSideBySide,
        className: "kg-easymde-split",
        title: i18n("keyword_glossary.markdown_preview"),
      },
      {
        name: "guide",
        action: "https://www.markdownguide.org/basic-syntax/",
        className: "kg-easymde-guide",
        title: "Markdown Guide",
      },
    ];
  }

  @action
  async setup(textarea) {
    if (this.editor) {
      return;
    }

    const EasyMDE = await ensureEasyMde();

    if (!EasyMDE) {
      return;
    }

    this.editor = new EasyMDE({
      element: textarea,
      initialValue: this.args.value || "",
      autoDownloadFontAwesome: false,
      autofocus: false,
      forceSync: true,
      indentWithTabs: false,
      lineNumbers: false,
      minHeight: "360px",
      placeholder:
        this.args.placeholder || i18n("keyword_glossary.markdown_editor"),
      previewClass: ["kg-easymde-preview-pane"],
      renderingConfig: {
        singleLineBreaks: false,
      },
      spellChecker: false,
      status: false,
      toolbar: this.toolbar,
    });

    this.lastValue = this.args.value || "";

    this.editor.codemirror.on("change", () => {
      const value = this.editor.value();

      if (value === this.lastValue) {
        return;
      }

      this.lastValue = value;
      this.args.change?.({ target: { value } });
    });
  }

  @action
  syncValue(value) {
    if (!this.editor) {
      return;
    }

    const nextValue = value || "";

    if (nextValue === this.lastValue) {
      return;
    }

    this.lastValue = nextValue;
    this.editor.value(nextValue);
    this.editor.codemirror.refresh();
  }

  willDestroy() {
    super.willDestroy(...arguments);
    this.editor?.toTextArea();
    this.editor = null;
  }
}

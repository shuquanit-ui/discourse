import { ajax } from "discourse/lib/ajax";
import { apiInitializer } from "discourse/lib/api";

const EXCLUDED_TAGS = new Set([
  "A",
  "BUTTON",
  "CODE",
  "INPUT",
  "PRE",
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
]);

const state = {
  entries: [],
  entryMap: new Map(),
  regex: null,
  loadPromise: null,
  loaded: false,
  panelOpen: false,
  activeTerm: null,
};

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEntries(entries) {
  return (entries || [])
    .map((entry) => ({
      ...entry,
      aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
    }))
    .filter((entry) => entry.term && (entry.description || entry.description_cooked));
}

function buildRegex(entries) {
  const terms = [
    ...new Set(
      entries
        .flatMap((entry) => [entry.term, ...entry.aliases])
        .map((term) => term?.trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
    ),
  ];

  if (!terms.length) {
    return null;
  }

  return new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
}

function buildEntryMap(entries) {
  const map = new Map();

  entries.forEach((entry) => {
    [entry.term, ...entry.aliases].forEach((term) => {
      const normalized = term?.trim().toLowerCase();
      if (normalized && !map.has(normalized)) {
        map.set(normalized, entry);
      }
    });
  });

  return map;
}

function isWordChar(character) {
  return /[A-Za-z0-9_]/.test(character || "");
}

function needsWordBoundary(term) {
  return /[A-Za-z0-9]/.test(term || "");
}

function createPanel(maxWidth) {
  let root = document.querySelector(".keyword-glossary-panel-root");

  if (root) {
    root.style.setProperty("--keyword-glossary-panel-width", `${maxWidth}px`);
    return root;
  }

  root = document.createElement("div");
  root.className = "keyword-glossary-panel-root";
  root.style.setProperty("--keyword-glossary-panel-width", `${maxWidth}px`);
  root.hidden = true;

  root.innerHTML = `
    <div class="keyword-glossary-panel-backdrop" data-keyword-glossary-close="1"></div>
    <aside class="keyword-glossary-panel" role="dialog" aria-modal="true" aria-label="Keyword glossary">
      <button class="keyword-glossary-panel__close" type="button" aria-label="${I18n.t("close")}">
        <span aria-hidden="true">×</span>
      </button>
      <div class="keyword-glossary-panel__content">
        <div class="keyword-glossary-panel__term"></div>
        <div class="keyword-glossary-panel__body cooked"></div>
        <a class="keyword-glossary-panel__link" target="_blank" rel="noopener noreferrer"></a>
      </div>
    </aside>
  `;

  document.body.appendChild(root);
  return root;
}

function setPanelOpen(root, open) {
  root.hidden = !open;
  root.classList.toggle("is-open", open);
  document.body.classList.toggle("keyword-glossary-panel-open", open);
  state.panelOpen = open;
}

function hidePanel(root) {
  if (!root || !state.panelOpen) {
    return;
  }

  state.activeTerm = null;
  setPanelOpen(root, false);
}

function renderPanel(root, entry) {
  const term = root.querySelector(".keyword-glossary-panel__term");
  const body = root.querySelector(".keyword-glossary-panel__body");
  const link = root.querySelector(".keyword-glossary-panel__link");

  term.textContent = entry.term;
  body.innerHTML = entry.description_cooked || "";

  if (entry.link_url) {
    link.href = entry.link_url;
    link.textContent = I18n.t("keyword_glossary.popup_link") || "View details";
    link.hidden = false;
  } else {
    link.hidden = true;
    link.removeAttribute("href");
    link.textContent = "";
  }
}

function showPanel(root, entry) {
  renderPanel(root, entry);
  state.activeTerm = entry.term;
  setPanelOpen(root, true);
}

function replaceTextNode(textNode, regex, entryMap) {
  const text = textNode.nodeValue;
  regex.lastIndex = 0;

  if (!regex.test(text)) {
    return;
  }

  regex.lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  text.replace(regex, (match, _group, index) => {
    if (index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
    }

    const entry = entryMap.get(match.toLowerCase());
    const previousChar = text[index - 1];
    const nextChar = text[index + match.length];
    const shouldRespectBoundary =
      entry && needsWordBoundary(match) && (isWordChar(previousChar) || isWordChar(nextChar));

    if (entry && !shouldRespectBoundary) {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "keyword-glossary-trigger";
      trigger.dataset.keywordGlossary = "1";
      trigger.dataset.term = entry.term;
      trigger.textContent = match;
      fragment.appendChild(trigger);
    } else {
      fragment.appendChild(document.createTextNode(match));
    }

    lastIndex = index + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  textNode.parentNode.replaceChild(fragment, textNode);
}

function processCooked(element) {
  if (!state.loaded || !state.regex || element.dataset.keywordGlossaryProcessed === "1") {
    return;
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;

      if (!parent || EXCLUDED_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (
        parent.closest(".keyword-glossary-trigger") ||
        parent.closest(".keyword-glossary-panel") ||
        parent.closest("[data-keyword-glossary-processed='1']")
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let current;

  while ((current = walker.nextNode())) {
    nodes.push(current);
  }

  nodes.forEach((node) => replaceTextNode(node, state.regex, state.entryMap));
  element.dataset.keywordGlossaryProcessed = "1";
}

function loadEntries() {
  if (state.loadPromise) {
    return state.loadPromise;
  }

  state.loadPromise = ajax("/keyword-glossary/entries.json")
    .then((response) => {
      state.entries = normalizeEntries(response.entries);
      state.entryMap = buildEntryMap(state.entries);
      state.regex = buildRegex(state.entries);
      state.loaded = true;
      document.querySelectorAll(".cooked").forEach((element) => processCooked(element));
    })
    .catch(() => {
      state.loaded = true;
      state.entries = [];
      state.entryMap = new Map();
      state.regex = null;
    });

  return state.loadPromise;
}

export default apiInitializer("1.8.0", (api) => {
  const siteSettingsService = api.container.lookup("service:site-settings");
  const globalSiteSettings = window.Discourse?.SiteSettings || {};
  const readSetting = (key, fallback = null) =>
    siteSettingsService?.[key] ??
    siteSettingsService?.settings?.[key] ??
    globalSiteSettings[key] ??
    fallback;

  if (!readSetting("keyword_glossary_enabled", false)) {
    return;
  }

  const panel = createPanel(Number(readSetting("keyword_glossary_max_width", 320) || 320));
  loadEntries();

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".keyword-glossary-trigger");
    const shouldClose = event.target.closest("[data-keyword-glossary-close='1']");
    const closeButton = event.target.closest(".keyword-glossary-panel__close");

    if (trigger) {
      event.preventDefault();
      const entry = state.entryMap.get((trigger.dataset.term || "").toLowerCase());

      if (!entry) {
        return;
      }

      showPanel(panel, entry);
      return;
    }

    if (shouldClose || closeButton) {
      hidePanel(panel);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hidePanel(panel);
    }
  });

  window.addEventListener("scroll", () => hidePanel(panel), { passive: true });
  window.addEventListener("resize", () => hidePanel(panel));

  api.onPageChange(() => {
    hidePanel(panel);
    document.querySelectorAll(".cooked").forEach((element) => {
      if (state.regex) {
        processCooked(element);
      }
    });
  });

  api.decorateCookedElement(
    (element) => {
      if (state.regex) {
        processCooked(element);
      } else {
        loadEntries().then(() => processCooked(element));
      }
    },
    { id: "keyword-glossary" }
  );
});

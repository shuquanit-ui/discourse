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
    .filter((entry) => entry.term && entry.description);
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

function createPopup(maxWidth) {
  let popup = document.querySelector(".keyword-glossary-popup");

  if (popup) {
    popup.style.maxWidth = `${maxWidth}px`;
    return popup;
  }

  popup = document.createElement("div");
  popup.className = "keyword-glossary-popup";
  popup.style.maxWidth = `${maxWidth}px`;
  popup.hidden = true;
  document.body.appendChild(popup);
  return popup;
}

function renderPopup(popup, entry) {
  popup.textContent = "";

  const title = document.createElement("div");
  title.className = "keyword-glossary-popup__term";
  title.textContent = entry.term;
  popup.appendChild(title);

  const body = document.createElement("div");
  body.className = "keyword-glossary-popup__desc";
  body.textContent = entry.description;
  popup.appendChild(body);

  if (entry.link_url) {
    const link = document.createElement("a");
    link.className = "keyword-glossary-popup__link";
    link.href = entry.link_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = I18n.t("keyword_glossary.popup_link") || "View details";
    popup.appendChild(link);
  }
}

function positionPopup(popup, target) {
  const margin = 8;
  const targetRect = target.getBoundingClientRect();

  popup.hidden = false;
  const popupRect = popup.getBoundingClientRect();

  let top = targetRect.bottom + window.scrollY + margin;
  let left = targetRect.left + window.scrollX;

  if (left + popupRect.width > window.scrollX + window.innerWidth - margin) {
    left = window.scrollX + window.innerWidth - popupRect.width - margin;
  }

  if (left < window.scrollX + margin) {
    left = window.scrollX + margin;
  }

  if (top + popupRect.height > window.scrollY + window.innerHeight - margin) {
    top = targetRect.top + window.scrollY - popupRect.height - margin;
  }

  popup.style.top = `${Math.max(top, window.scrollY + margin)}px`;
  popup.style.left = `${left}px`;
}

function hidePopup(popup) {
  popup.hidden = true;
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

    if (entry) {
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
  const siteSettings = api.container.lookup("service:site-settings")?.settings || {};

  if (!siteSettings.keyword_glossary_enabled) {
    return;
  }

  const popup = createPopup(Number(siteSettings.keyword_glossary_max_width || 320));
  loadEntries();

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".keyword-glossary-trigger");

    if (!trigger) {
      if (!popup.contains(event.target)) {
        hidePopup(popup);
      }
      return;
    }

    event.preventDefault();
    const entry = state.entryMap.get((trigger.dataset.term || "").toLowerCase());

    if (!entry) {
      return;
    }

    renderPopup(popup, entry);
    positionPopup(popup, trigger);
  });

  window.addEventListener("scroll", () => hidePopup(popup), { passive: true });
  window.addEventListener("resize", () => hidePopup(popup));

  api.onPageChange(() => {
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

import { ajax } from "discourse/lib/ajax";
import { apiInitializer } from "discourse/lib/api";
import I18n from "discourse-i18n";

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
  activeEntryId: null,
  correctionOpen: false,
  submittingCorrection: false,
};

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
  return (text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEntries(entries) {
  return (entries || [])
    .map((entry) => ({
      ...entry,
      aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
      upvotes_count: entry.upvotes_count || 0,
      downvotes_count: entry.downvotes_count || 0,
      corrections_count: entry.corrections_count || 0,
      current_vote: entry.current_vote || 0,
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

function findEntryById(entryId) {
  return state.entries.find((entry) => String(entry.id) === String(entryId));
}

function setActiveEntry(entry) {
  if (!entry) {
    state.activeEntryId = null;
    return;
  }

  state.activeEntryId = entry.id;
  const existing = findEntryById(entry.id);
  if (existing) {
    Object.assign(existing, entry);
  }
}

function currentEntry() {
  return findEntryById(state.activeEntryId);
}

function aliasesText(entry) {
  return (entry.aliases || []).filter(Boolean).join(" / ");
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
        <div class="keyword-glossary-panel__header">
          <img class="keyword-glossary-panel__logo" alt="" hidden />
          <div class="keyword-glossary-panel__header-copy">
            <div class="keyword-glossary-panel__term"></div>
            <div class="keyword-glossary-panel__aliases" hidden></div>
          </div>
        </div>
        <div class="keyword-glossary-panel__body cooked"></div>
        <div class="keyword-glossary-panel__feedback">
          <div class="keyword-glossary-panel__vote-group">
            <button class="keyword-glossary-panel__vote" type="button" data-keyword-glossary-vote="1"></button>
            <button class="keyword-glossary-panel__vote" type="button" data-keyword-glossary-vote="-1"></button>
          </div>
          <button class="keyword-glossary-panel__correction-toggle" type="button"></button>
        </div>
        <div class="keyword-glossary-panel__feedback-meta"></div>
        <form class="keyword-glossary-panel__correction-form" hidden>
          <textarea class="keyword-glossary-panel__correction-input" rows="4" placeholder="${escapeHtml(
            I18n.t("keyword_glossary.correction_placeholder")
          )}"></textarea>
          <div class="keyword-glossary-panel__correction-actions">
            <button class="btn btn-primary" type="submit">${escapeHtml(
              I18n.t("keyword_glossary.submit_correction")
            )}</button>
            <button class="btn btn-default" type="button" data-keyword-glossary-cancel-correction="1">${escapeHtml(
              I18n.t("keyword_glossary.cancel")
            )}</button>
          </div>
        </form>
      </div>
      <div class="keyword-glossary-panel__footer">
        <a class="keyword-glossary-panel__link btn btn-primary" target="_blank" rel="noopener noreferrer" hidden></a>
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

function toggleCorrection(root, open) {
  const form = root.querySelector(".keyword-glossary-panel__correction-form");
  const toggleButton = root.querySelector(".keyword-glossary-panel__correction-toggle");
  const textarea = root.querySelector(".keyword-glossary-panel__correction-input");

  if (!form || !toggleButton) {
    return;
  }

  state.correctionOpen = open;
  form.hidden = !open;
  toggleButton.classList.toggle("is-active", open);
  toggleButton.textContent = open
    ? I18n.t("keyword_glossary.cancel")
    : I18n.t("keyword_glossary.correction");

  if (!open && textarea) {
    textarea.value = "";
  }
}

function hidePanel(root) {
  if (!root || !state.panelOpen) {
    return;
  }

  state.activeEntryId = null;
  toggleCorrection(root, false);
  setPanelOpen(root, false);
}

function renderFeedback(root, entry) {
  const upButton = root.querySelector("[data-keyword-glossary-vote='1']");
  const downButton = root.querySelector("[data-keyword-glossary-vote='-1']");
  const meta = root.querySelector(".keyword-glossary-panel__feedback-meta");

  if (!upButton || !downButton || !meta) {
    return;
  }

  upButton.classList.toggle("is-active", entry.current_vote === 1);
  downButton.classList.toggle("is-active", entry.current_vote === -1);
  upButton.textContent = `👍 ${I18n.t("keyword_glossary.vote_up")} (${entry.upvotes_count || 0})`;
  downButton.textContent = `👎 ${I18n.t("keyword_glossary.vote_down")} (${entry.downvotes_count || 0})`;
  meta.textContent = I18n.t("keyword_glossary.correction_count", {
    count: entry.corrections_count || 0,
  });
}

function renderPanel(root, entry) {
  const term = root.querySelector(".keyword-glossary-panel__term");
  const aliases = root.querySelector(".keyword-glossary-panel__aliases");
  const body = root.querySelector(".keyword-glossary-panel__body");
  const link = root.querySelector(".keyword-glossary-panel__link");
  const logo = root.querySelector(".keyword-glossary-panel__logo");
  const footer = root.querySelector(".keyword-glossary-panel__footer");

  term.textContent = entry.term;
  body.innerHTML = entry.description_cooked || "";

  const aliasLine = aliasesText(entry);
  if (aliasLine) {
    aliases.hidden = false;
    aliases.textContent = aliasLine;
  } else {
    aliases.hidden = true;
    aliases.textContent = "";
  }

  if (entry.logo_url) {
    logo.src = entry.logo_url;
    logo.alt = entry.term;
    logo.hidden = false;
  } else {
    logo.hidden = true;
    logo.removeAttribute("src");
    logo.alt = "";
  }

  if (entry.link_url) {
    link.href = entry.link_url;
    link.textContent = I18n.t("keyword_glossary.popup_link") || "View details";
    link.hidden = false;
    footer.hidden = false;
  } else {
    link.hidden = true;
    link.removeAttribute("href");
    link.textContent = "";
    footer.hidden = true;
  }

  renderFeedback(root, entry);
  toggleCorrection(root, false);
}

function showPanel(root, entry) {
  setActiveEntry(entry);
  renderPanel(root, currentEntry());
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

function updateEntryState(entryId, payload) {
  const entry = findEntryById(entryId);

  if (!entry) {
    return null;
  }

  Object.assign(entry, payload);
  return entry;
}

async function submitVote(root, entryId, value) {
  const updated = await ajax(`/keyword-glossary/entries/${entryId}/vote`, {
    type: "POST",
    data: { value },
  });

  const entry = updateEntryState(entryId, updated);
  if (entry) {
    renderFeedback(root, entry);
  }
}

async function submitCorrection(root, entryId) {
  const textarea = root.querySelector(".keyword-glossary-panel__correction-input");
  if (!textarea) {
    return;
  }

  const content = textarea.value.trim();
  if (!content || state.submittingCorrection) {
    return;
  }

  state.submittingCorrection = true;

  try {
    const updated = await ajax(`/keyword-glossary/entries/${entryId}/correction`, {
      type: "POST",
      data: { content },
    });
    const entry = updateEntryState(entryId, updated);
    if (entry) {
      renderFeedback(root, entry);
    }
    toggleCorrection(root, false);
    popupAjax(I18n.t("keyword_glossary.correction_success"));
  } finally {
    state.submittingCorrection = false;
  }
}

function popupAjax(message) {
  window.alert(message);
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
    const correctionToggle = event.target.closest(".keyword-glossary-panel__correction-toggle");
    const cancelCorrection = event.target.closest("[data-keyword-glossary-cancel-correction='1']");
    const voteButton = event.target.closest("[data-keyword-glossary-vote]");

    if (trigger) {
      event.preventDefault();
      const entry = state.entryMap.get((trigger.dataset.term || "").toLowerCase());

      if (!entry) {
        return;
      }

      showPanel(panel, entry);
      return;
    }

    if (voteButton && state.activeEntryId) {
      event.preventDefault();
      submitVote(panel, state.activeEntryId, Number(voteButton.dataset.keywordGlossaryVote)).catch(
        () => popupAjax(I18n.t("keyword_glossary.errors.vote_failed"))
      );
      return;
    }

    if (correctionToggle) {
      event.preventDefault();
      toggleCorrection(panel, !state.correctionOpen);
      return;
    }

    if (cancelCorrection) {
      event.preventDefault();
      toggleCorrection(panel, false);
      return;
    }

    if (shouldClose || closeButton) {
      hidePanel(panel);
    }
  });

  panel
    .querySelector(".keyword-glossary-panel__correction-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!state.activeEntryId) {
        return;
      }
      submitCorrection(panel, state.activeEntryId).catch(() =>
        popupAjax(I18n.t("keyword_glossary.errors.correction_failed"))
      );
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

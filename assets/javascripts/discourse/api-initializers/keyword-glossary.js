import { apiInitializer } from "discourse/lib/api";

const EXCLUDED_TAGS = new Set([
  "A",
  "CODE",
  "PRE",
  "SCRIPT",
  "STYLE",
  "TEXTAREA",
  "INPUT",
  "BUTTON",
]);

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeEntries(rawEntries) {
  const lines = Array.isArray(rawEntries)
    ? rawEntries
    : (rawEntries || "").split("\n");

  return lines
    .map((line) => (line || "").trim())
    .filter(Boolean)
    .map((line) => {
      const [term = "", description = "", url = ""] = line.split("|");
      return {
        term: term.trim(),
        description: description.trim(),
        url: url.trim(),
      };
    })
    .filter((entry) => entry.term && entry.description);
}

function buildRegex(entries) {
  const sortedTerms = [...entries]
    .map((entry) => entry.term)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);

  if (!sortedTerms.length) {
    return null;
  }

  return new RegExp(`(${sortedTerms.join("|")})`, "g");
}

function createPopup(maxWidth) {
  let popup = document.querySelector(".keyword-glossary-popup");
  if (popup) {
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

  if (entry.url) {
    const link = document.createElement("a");
    link.className = "keyword-glossary-popup__link";
    link.href = entry.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "查看详情";
    popup.appendChild(link);
  }
}

function positionPopup(popup, target) {
  const targetRect = target.getBoundingClientRect();
  popup.hidden = false;
  const popupRect = popup.getBoundingClientRect();

  const margin = 8;
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

function processCooked(element, regex, entryMap) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      const parent = node.parentElement;
      if (!parent || EXCLUDED_TAGS.has(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest("[data-keyword-glossary-processed='1']")) {
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

  nodes.forEach((node) => replaceTextNode(node, regex, entryMap));
  element.dataset.keywordGlossaryProcessed = "1";
}

export default apiInitializer("1.8.0", (api) => {
  if (!settings.keyword_glossary_enabled) {
    return;
  }

  const entries = normalizeEntries(settings.keyword_glossary_entries);
  if (!entries.length) {
    return;
  }

  const regex = buildRegex(entries);
  if (!regex) {
    return;
  }

  const entryMap = new Map();
  entries.forEach((entry) => {
    entryMap.set(entry.term.toLowerCase(), entry);
  });

  const popup = createPopup(Number(settings.keyword_glossary_max_width || 320));
  const mode = settings.keyword_glossary_trigger || "click";

  const openPopup = (trigger) => {
    const entry = entryMap.get((trigger.dataset.term || "").toLowerCase());
    if (!entry) {
      return;
    }

    renderPopup(popup, entry);
    positionPopup(popup, trigger);
  };

  if (mode === "click") {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".keyword-glossary-trigger");
      if (!trigger) {
        if (!popup.contains(event.target)) {
          hidePopup(popup);
        }
        return;
      }

      event.preventDefault();
      openPopup(trigger);
    });
  } else {
    document.addEventListener("mouseover", (event) => {
      const trigger = event.target.closest(".keyword-glossary-trigger");
      if (trigger) {
        openPopup(trigger);
      }
    });

    document.addEventListener("mouseout", (event) => {
      if (
        event.target.closest(".keyword-glossary-trigger") &&
        !popup.matches(":hover")
      ) {
        hidePopup(popup);
      }
    });
  }

  window.addEventListener("scroll", () => hidePopup(popup), { passive: true });
  window.addEventListener("resize", () => hidePopup(popup));

  api.decorateCookedElement(
    (element) => {
      processCooked(element, regex, entryMap);
    },
    { id: "keyword-glossary" }
  );
});

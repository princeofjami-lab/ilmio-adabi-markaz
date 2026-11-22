
async function loadContent() {
  const response = await fetch("./content.json");

  if (!response.ok) {
    throw new Error("مواد لوڈ نہیں ہوسکا");
  }

  const content = await response.json();

  renderEntries("articles-list", content.articles, "article");
  renderEntries("research-list", content.research, "research");
  renderEntries("fatwas-list", content.fatwas, "fatwa");
  renderEntries("publications-list", content.publications, "publication");
  renderEntries("library-list", content.library, "library");
}

function renderEntries(containerId, entries, type) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.replaceChildren();

  if (!entries || entries.length === 0) {
    const message = document.createElement("p");
    message.textContent = "ابھی اس حصے میں کوئی مواد شامل نہیں کیا گیا۔";
    container.appendChild(message);
    return;
  }

  entries.forEach(entry => {
    const article = document.createElement("article");
    article.className = "entry";

    const title = document.createElement("h3");
    title.className = "entry-title";
    title.textContent = entry.title || "بلا عنوان";
    article.appendChild(title);

    if (entry.author || entry.date) {
      const meta = document.createElement("p");
      meta.className = "entry-meta";
      meta.textContent = [entry.author, entry.date].filter(Boolean).join(" — ");
      article.appendChild(meta);
    }

    if (type === "fatwa") {
      if (entry.question) {
        const question = document.createElement("p");
        question.className = "entry-question";
        question.textContent = "سوال: " + entry.question;
        article.appendChild(question);
      }

      if (entry.answer) {
        const answer = document.createElement("div");
        answer.className = "entry-answer";
        answer.textContent = "جواب: " + entry.answer;
        article.appendChild(answer);
      }
    } else {
      if (entry.summary) {
        const summary = document.createElement("p");
        summary.className = "entry-summary";
        summary.textContent = entry.summary;
        article.appendChild(summary);
      }

      if (entry.body) {
        const body = document.createElement("div");
        body.className = "entry-body";
        body.innerHTML = entry.body;
        article.appendChild(body);
      }

      if (entry.description) {
        const description = document.createElement("p");
        description.className = "entry-description";
        description.textContent = entry.description;
        article.appendChild(description);
      }
    }

    if (
      (type === "publication" || type === "library") &&
      entry.pdf
    ) {
      const link = document.createElement("a");
      link.className = "pdf-link";
      link.href = entry.pdf;
      link.textContent = "پی ڈی ایف ملاحظہ کریں";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      article.appendChild(link);
    }

    container.appendChild(article);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadContent().catch(error => {
    console.error("Content loading error:", error);
  });
});



import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

const root = process.cwd();
const output = path.join(root, "_site");

const collections = {
  articles: "content/articles",
  research: "content/research",
  fatwas: "content/fatawa",
  publications: "content/publications",
  library: "content/library"
};

function safeImageUrl(value) {
  if (!value || typeof value !== "string") return "";

  const src = value.trim();

  if (/^https:\/\//i.test(src)) return src;

  if (
    src.startsWith("/") ||
    src.includes("\\") ||
    src.split("/").includes("..") ||
    !/^media\/images\/[a-zA-Z0-9_\-./]+$/i.test(src)
  ) {
    return "";
  }

  return "/" + src;
}

function safePdfUrl(value) {
  if (!value || typeof value !== "string") return "";

  const src = value.trim();

  if (
    src.startsWith("/") ||
    src.includes("\\") ||
    src.split("/").includes("..") ||
    !/^media\/documents\/[a-zA-Z0-9_\-./]+\.pdf$/i.test(src)
  ) {
    return "";
  }

  return "/" + src;
}

function cleanHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2", "h3", "h4", "figure", "figcaption"
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["class"]
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        { rel: "noopener noreferrer" },
        true
      ),
      img: (tagName, attribs) => ({
        tagName: "img",
        attribs: {
          src: safeImageUrl(attribs.src),
          alt: attribs.alt || "",
          title: attribs.title || ""
        }
      })
    },
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !frame.attribs.src
  });
}

async function readCollection(name, directory) {
  const folder = path.join(root, directory);

  if (!fs.existsSync(folder)) return [];

  const files = fs.readdirSync(folder)
    .filter(file => file.endsWith(".md"))
    .sort()
    .reverse();

  const entries = [];

  for (const file of files) {
    const fullPath = path.join(folder, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data;

    let entry = {
      title: data.title || "",
      author: data.author || "",
      date: data.date || "",
      summary: data.summary || "",
      body: cleanHtml(marked.parse(parsed.content)),
      question: data.question || "",
      answer: data.answer || "",
      description: data.description || "",
      pdf: safePdfUrl(data.pdf || "")
    };

    entries.push(entry);
  }

  return entries;
}

async function build() {
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });

  const content = {};

  for (const [name, directory] of Object.entries(collections)) {
    content[name] = await readCollection(name, directory);
  }

  fs.writeFileSync(
    path.join(output, "content.json"),
    JSON.stringify(content, null, 2),
    "utf8"
  );

  for (const item of ["index.html", "assets", "media"]) {
    const source = path.join(root, item);

    if (fs.existsSync(source)) {
      fs.cpSync(source, path.join(output, item), {
        recursive: true
      });
    }
  }

  console.log("Website built successfully.");
}

build().catch(error => {
  console.error("Build failed:", error);
  process.exit(1);
});

"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { Code2, Copy, Trash2 } from "lucide-react";

const storageKey = "techverse30:developer-snippets:v1";
const storageUnavailable = "__techverse30_storage_unavailable__";
const snippetsChangedEvent = "techverse30:snippets-changed";
const languages = [
  "typescript",
  "javascript",
  "python",
  "html",
  "css",
  "sql",
  "json",
] as const;

type Language = (typeof languages)[number];

type Snippet = {
  id: string;
  title: string;
  language: Language;
  code: string;
};

type SnippetSnapshot = {
  snippets: Snippet[];
  error: string;
  storageReady: boolean;
};

const starterCode = `export function greet(name: string) {
  return \`Hello, \${name}!\`;
}`;

function subscribeToSnippets(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(snippetsChangedEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(snippetsChangedEvent, onStoreChange);
  };
}

function getSnippetSnapshot(): string {
  try {
    return window.localStorage.getItem(storageKey) ?? "[]";
  } catch {
    return storageUnavailable;
  }
}

function getServerSnapshot(): string {
  return "[]";
}

function isLanguage(value: unknown): value is Language {
  return languages.some((language) => language === value);
}

function isSnippet(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") return false;
  const snippet = value as Record<string, unknown>;
  return (
    typeof snippet.id === "string" &&
    typeof snippet.title === "string" &&
    isLanguage(snippet.language) &&
    typeof snippet.code === "string"
  );
}

function parseSnippetSnapshot(snapshot: string): SnippetSnapshot {
  if (snapshot === storageUnavailable) {
    return {
      snippets: [],
      error: "Browser storage is unavailable; snippets cannot be loaded or saved.",
      storageReady: false,
    };
  }

  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed) || !parsed.every(isSnippet)) {
      throw new Error("The saved snippet data has an unexpected format.");
    }
    return { snippets: parsed, error: "", storageReady: true };
  } catch (cause: unknown) {
    return {
      snippets: [],
      error:
        cause instanceof Error
          ? `Could not read saved snippets: ${cause.message}`
          : "Could not read saved snippets from this browser.",
      storageReady: true,
    };
  }
}

export default function DeveloperWorkspace() {
  const snapshot = useSyncExternalStore(
    subscribeToSnippets,
    getSnippetSnapshot,
    getServerSnapshot,
  );
  const { snippets, error: storageError, storageReady } = useMemo(
    () => parseSnippetSnapshot(snapshot),
    [snapshot],
  );
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState<Language>("typescript");
  const [code, setCode] = useState(starterCode);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const saveSnippets = (next: Snippet[], successMessage: string): boolean => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setError("Could not save snippets. Browser storage may be full or unavailable.");
      setNotice("");
      return false;
    }
    window.dispatchEvent(new Event(snippetsChangedEvent));
    setError("");
    setNotice(successMessage);
    return true;
  };

  const createSnippet = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || !code.trim()) {
      setError("Add a snippet title and code before saving.");
      setNotice("");
      return;
    }

    const snippet: Snippet = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      language,
      code,
    };
    if (saveSnippets([snippet, ...snippets], "Snippet saved in this browser.")) {
      setTitle("");
    }
  };

  const copySnippet = async (snippet: Snippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
    } catch {
      setError("Could not copy the snippet. Check clipboard permissions and try again.");
      setNotice("");
      return;
    }
    setError("");
    setNotice(`${snippet.title} copied to the clipboard.`);
  };

  return (
    <section className="developer-workspace" aria-labelledby="developer-workspace-title">
      <div className="developer-workspace-heading">
        <div>
          <span className="panel-eyebrow">STAGE 05 · SOFTWARE DEVELOPMENT</span>
          <h3 id="developer-workspace-title">Code snippet library</h3>
          <p>Save reusable code in this browser, then copy it when you need it.</p>
        </div>
        <span className="developer-snippet-count">
          {snippets.length} {snippets.length === 1 ? "SNIPPET" : "SNIPPETS"}
        </span>
      </div>

      {(error || storageError) && (
        <p className="developer-feedback developer-feedback-error" role="alert">
          {error || storageError}
        </p>
      )}
      {notice && (
        <p className="developer-feedback developer-feedback-success" role="status">
          {notice}
        </p>
      )}

      <div className="developer-workspace-grid">
        <form className="developer-editor" onSubmit={createSnippet}>
          <div className="developer-editor-fields">
            <label>
              Snippet title
              <input
                required
                maxLength={100}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Greeting helper"
                disabled={!storageReady}
              />
            </label>
            <label>
              Language
              <select
                value={language}
                onChange={(event) => {
                  if (isLanguage(event.target.value)) setLanguage(event.target.value);
                }}
                disabled={!storageReady}
              >
                {languages.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="developer-code-label">
            Code
            <textarea
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              disabled={!storageReady}
            />
          </label>
          <button className="asset-primary-button" disabled={!storageReady}>
            <Code2 size={14} aria-hidden="true" />
            Save snippet
          </button>
        </form>

        <div className="developer-snippet-list" aria-label="Saved code snippets">
          {snippets.length === 0 ? (
            <div className="developer-snippet-empty">
              <Code2 size={18} aria-hidden="true" />
              <p>No snippets saved yet.</p>
              <span>Your saved snippets stay in this browser.</span>
            </div>
          ) : (
            snippets.map((snippet) => (
              <article className="developer-snippet-card" key={snippet.id}>
                <div className="developer-snippet-card-heading">
                  <div>
                    <strong>{snippet.title}</strong>
                    <span>{snippet.language.toUpperCase()}</span>
                  </div>
                  <div className="developer-snippet-actions">
                    <button
                      type="button"
                      className="developer-icon-button"
                      aria-label={`Copy ${snippet.title}`}
                      onClick={() => void copySnippet(snippet)}
                    >
                      <Copy size={13} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="developer-icon-button developer-icon-button-danger"
                      aria-label={`Delete ${snippet.title}`}
                      onClick={() =>
                        saveSnippets(
                          snippets.filter((item) => item.id !== snippet.id),
                          `${snippet.title} deleted.`,
                        )
                      }
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <pre><code>{snippet.code}</code></pre>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

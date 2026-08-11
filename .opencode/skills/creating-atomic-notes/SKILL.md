---
name: creating-atomic-notes
description: Use when decomposing large multi-topic source material, transcripts, or complex system specifications into structured, modular atomic notes and mapping them in a central index file.
---

# Creating Atomic Notes

## Overview
Decompose large, complex, or multi-topic information into single-responsibility, highly focused markdown files (Atomic Notes) and link them together in a central Map of Content (Core Note / MOC). This ensures modularity, high-density linking, and clean connection mappings in your personal knowledge base.

---

## When to Use
Use this skill when:
*   Ingesting long transcripts, textbooks, or course files covering multiple distinct subjects.
*   Documenting complex software architectures with independent modules (e.g., API views, models, background tasks).
*   Creating a personal reference library for languages, libraries, or frameworks.

Do NOT use for:
*   Simple, single-topic concepts that naturally fit into one short page.
*   One-off logs, checklists, or journals.

---

## The Core Pattern: Modular vs. Atomic

*   **Modular Notes (Incorrect):** Creating notes that represent a course chapter or lecture (e.g., `04_views_and_urls.md` or `08_models_and_relationships.md`). These are still too large and contain multiple distinct ideas.
*   **Atomic Notes (Correct):** Breaking down concepts into their smallest single-responsibility units (e.g., `views.md`, `url_routing.md`, `django_relationships_one_to_many.md`).

```
ultimate-django-course/
  ├── Django.md                              # Core Note / Map of Content (MOC)
  ├── framework.md                    # Atomic Note (single concept)
  ├── views.md                        # Atomic Note (single concept)
  ├── url_routing.md                  # Atomic Note (single concept)
  └── models.md                       # Atomic Note (single concept)
```

---

## Anatomy of the Notes

### 1. The Atomic Note
Each atomic note must cover **exactly one single idea/concept** and contain:
*   **YAML Frontmatter:** Identifies the type, tags, sources, and metadata.
*   **H1 Title:** Clear, searchable topic title.
*   **Self-Contained Content:** Concise explanation, 1-2 clear code snippets, and instructions.
*   **Backlinks:** Standard relative markdown links or wiki links pointing back to the parent Core Note.

```markdown
---
type: concept
tags: [django, routing]
sources: [raw/Notes/Courses/ultimate django course/Django.md]
last_updated: 2026-07-14
---

# Django URL Routing

[Content explaining URL mapping with python examples...]

---
Back to: [[Django.md]]
```

### 2. The Core Note (Map of Content / MOC)
The Core Note is **not just a directory or a list of files**. It is a narrative study note itself that explains the **logic and system flow** of the domain, connecting the atomic concepts dynamically in context using inline wiki links (e.g., `[[django_views]]`, `[[django_url_routing]]`).

---

## Implementation Steps

1.  **Analyze and Segment:** Read the source material and extract the individual "mental Lego bricks" (atomic concepts).
2.  **Create Atomic Files:** Write short, focused files for each concept. Ensure they include correct YAML metadata and a backlink to the MOC.
3.  **Construct the Narrative MOC:** Write the central `README.md` index file. Draft a conceptual flow explaining how all the atomic notes relate, inserting bidirectional links inline to map the logic.
4.  **Use Vault-Compatible Links:** 
    *   Use relative links (e.g., `[Coroutines](coroutines.md)`) or double-bracket wiki links (e.g., `[[coroutines]]`).
    *   **STRICTLY FORBID** absolute paths or `file:///` URLs (they break on mobile or sync).

---

## Common Mistakes

| Excuse / Mistake | Reality |
| :--- | :--- |
| **Using `file:///` absolute paths** | Breaks on other devices (like mobile sync) or when the vault folder is renamed/moved. Always use relative paths or wiki brackets. |
| **Creating a simple index bullet list** | A list doesn't map logic. The MOC must be an explanatory narrative connecting the concepts. |
| **Creating modular "chapters" instead of atomic notes** | Large files clutter the local graph and make it harder to search specific ideas. Keep notes focused on a single complete idea. |
| **Missing YAML Frontmatter** | Prevents metadata parsers (like Dataview) from indexing the note properties. |
| **Orphan Notes** | Notes with no link back to the core index get lost. Every child must link back. |

## Red Flags
*   "Creating link: `file:///D:/notes/...`" -> **STOP. Replace with relative paths.**
*   "Writing multiple concepts into a chapter note" -> **STOP. Split into individual atomic files.**
*   "MOC README is just a table of contents" -> **STOP. Rewrite it as a narrative logic map.**


---
name: creating-atomic-notes
description: Use when decomposing large multi-topic source material, transcripts, complex system specifications, or algorithmic courses into structured, modular atomic notes mapping to a central index file with rich visuals, diagrams, workflows, detailed dry runs, and complete code examples.
---

# Creating Atomic Notes (Enhanced Standard)

## Overview
Decompose large, complex, multi-topic information into single-responsibility, highly focused markdown files (**Atomic Notes**) linked together by a central Map of Content (**Core Note / MOC**). This ensures modularity, high-density linking, clean connection mappings, and deep conceptual clarity in the personal knowledge base.

---

## When to Use
Use this skill when:
- Ingesting algorithmic lectures (DSA), computer science courses, textbooks, and technical transcripts.
- Documenting complex software architectures, data structures, and algorithmic paradigms.
- Creating a personal reference library for programming languages, algorithms, and system design.

**Do NOT use for:**
- Simple, single-topic concepts that naturally fit on one short page.
- One-off temporary logs, quick checklists, or daily journals.

---

## Core Pattern: Modular vs. Atomic

- **Modular Notes (Incorrect):** Creating notes that lump an entire course chapter or lecture into a single fragmented file with multiple unrelated concepts.
- **Atomic Notes (Correct):** Breaking down each distinct concept into the smallest self-contained, single-responsibility unit.

```
DSA/Lecture-12-Binary-Search-Explained/
├── Lecture-12-Binary-Search-Explained.md  <-- Core Note / Map of Content (MOC)
├── Binary-Search-Algorithm.md             <-- Atomic Note (single concept)
├── mid-Formula-and-Overflow.md            <-- Atomic Note (single concept)
└── Binary-Search-Dry-Run.md               <-- Atomic Note (single concept)
```

---

## Mandatory Anatomy of Notes

### 1. Atomic Note
Each atomic note must cover **exactly one single concept** and adhere to the following mandatory standards:

1. **YAML Frontmatter:**
   - `type`: `concept` | `algorithm` | `data-structure` | `problem-solution`
   - `title`: Clean, searchable topic title.
   - `lecture_no`: Lecture number if applicable.
   - `tags`: Specific, searchable tags (e.g. `[dsa, binary-search, algorithms, cpp, python]`).
   - `sources`: Array pointing to the parent Core Note.
   - `last_updated`: Date (YYYY-MM-DD).

2. **H1 Title & Intuition:**
   - Clear title and high-level conceptual intuition answering: *What is it, why does it exist, and when do we use it?*

3. **Visuals, Charts & Architectures:**
   - **Mermaid Diagrams:** Valid `graph TD` / `graph LR` flowcharts, state transitions, or sequence diagrams with correct syntax.
   - **ASCII Memory Maps & Pointer Layouts:** Visual depiction of indices, pointers (`start`, `mid`, `end`, `slow`, `fast`), stack frames, or node pointers (`[data | next] ->`).

4. **Workflows & Decision Processes:**
   - Clear decision logic showing how choices are made (e.g., pruning halves in binary search, partition steps in quicksort, rotations in AVL trees).

5. **Step-by-Step Detailed Dry Runs:**
   - Comprehensive trace table tracking variables at every single iteration/step:
     `| Step / Iteration | Variables / Pointers | Condition Evaluated | Action Taken | Search Space / Array State |`
   - Visual pointer representation showing progression until base case or termination.

6. **Production-Ready Multi-Language Code Examples:**
   - Clean, idiomatic, fully functional implementations in **C++** and **Python**.
   - Explicit edge case handling (empty input, single element, duplicates, odd/even size, integer overflow).
   - Clear inline comments explaining non-trivial lines.

7. **Complexity & Edge Cases Matrix:**
   - **Time Complexity:** Best, Average, Worst case with mathematical justification ($O(1)$, $O(\log n)$, $O(n)$, etc.).
   - **Space Complexity:** Auxiliary Space and Recursive Call Stack Space.
   - **Edge Cases Considered:** Explicit table or list of edge cases and their handling.

8. **Backlinks:**
   - Clean markdown or wiki link back to the parent Core Note: `Back to: [[Parent-Core-Note]]`.

---

### Example Atomic Note Template

```markdown
---
title: "Binary Search Algorithm"
type: algorithm
lecture_no: 12
tags: [dsa, lecture-12, binary-search, searching, cpp, python]
sources: [raw/Notes/DSA/Lecture-12-Binary-Search-Explained-1-Video-Theory-Code/Lecture-12-Binary-Search-Explained-1-Video-Theory-Code.md]
last_updated: 2026-10-01
---

# Binary Search Algorithm

## 1. Overview & Core Intuition
Binary search is an efficient search algorithm for **sorted collections**. It operates on the principle of divide-and-conquer, repeatedly halving the search space by comparing the target with the middle element.

- **Monotonicity Requirement:** The search space must be monotonic (strictly non-decreasing or non-increasing) or have a monotonic predicate.

## 2. Visual Architecture & Workflow

```mermaid
graph TD
    Start([Start Search]) --> Init[Initialize: start = 0, end = n - 1]
    Init --> Condition{start <= end?}
    Condition -- No --> NotFound[Return -1: Target Not Present]
    Condition -- Yes --> CalcMid["mid = start + (end - start) / 2"]
    CalcMid --> Compare{arr[mid] == target?}
    Compare -- Equal --> Found["Return mid: Target Found!"]
    Compare -- "arr[mid] < target" --> GoRight["Search Right Half: start = mid + 1"]
    Compare -- "arr[mid] > target" --> GoLeft["Search Left Half: end = mid - 1"]
    GoRight --> Condition
    GoLeft --> Condition
```

### Pointer Movement Layout (ASCII)
```
Initial State:
Indices:    0    1    2    3    4    5
Array:    [ 2    4    6    8   12   18 ]
           ^              ^              ^
         start           mid            end
```

## 3. Step-by-Step Detailed Dry Run
Target: `target = 12`, Array: `arr = [2, 4, 6, 8, 12, 18]` ($n = 6$)

| Step | `start` | `end` | `mid` formula | `mid` | `arr[mid]` | Evaluation (`arr[mid]` vs `12`) | Action Taken | Search Window |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | 0 | 5 | $0 + (5-0)/2$ | 2 | 6 | $6 < 12$ | Target in right half; `start = mid + 1` | `[8, 12, 18]` (indices 3..5) |
| 2 | 3 | 5 | $3 + (5-3)/2$ | 4 | 12 | $12 == 12$ | Element matched! Return index `4` | Target located at index 4 |

## 4. Multi-Language Implementations

### C++ Implementation (Iterative & Safe)
```cpp
#include <iostream>
#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
    int start = 0;
    int end = static_cast<int>(arr.size()) - 1;

    while (start <= end) {
        // Prevent overflow: start + (end - start) / 2
        int mid = start + (end - start) / 2;

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            start = mid + 1; // Discard left half
        } else {
            end = mid - 1;   // Discard right half
        }
    }
    return -1; // Target not found
}
```

### Python Implementation
```python
from typing import List

def binary_search(arr: List[int], target: int) -> int:
    """
    Performs standard iterative binary search on a sorted array.
    Returns the 0-based index if found, otherwise -1.
    """
    start, end = 0, len(arr) - 1

    while start <= end:
        mid = start + (end - start) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            start = mid + 1
        else:
            end = mid - 1

    return -1
```

## 5. Complexity & Edge Case Matrix

| Metric | Complexity | Mathematical Rationale |
|:---|:---|:---|
| **Best Time** | $O(1)$ | Target found at initial midpoint `mid`. |
| **Average Time** | $O(\log n)$ | Search space halved every step: $n/2^k = 1 \implies k = \log_2 n$. |
| **Worst Time** | $O(\log n)$ | Target at boundaries or not present. |
| **Auxiliary Space** | $O(1)$ | Constant extra space for pointers `start`, `end`, `mid`. |
| **Call Stack Space** | $O(1)$ | Iterative loop consumes zero recursive call stack frames. |

### Edge Cases Handled
- **Empty Array (`n = 0`):** `start = 0, end = -1` $\to$ loop does not run, returns `-1`.
- **Single Element (`n = 1`):** `start = 0, end = 0, mid = 0` $\to$ correctly checks `arr[0]`.
- **Target Smaller than Minimum:** `end` drops to `-1`, returns `-1`.
- **Target Larger than Maximum:** `start` climbs to `n`, returns `-1`.
- **Large Indices:** Overflow avoided using `start + (end - start) / 2`.

---
Back to: [[Lecture-12-Binary-Search-Explained-1-Video-Theory-Code]]
```

---

### 2. Core Note (Map of Content / MOC)
A Core Note is **not a plain directory list of files**. It is an explanatory narrative study note that explains the **logic, architecture, and system flow** of the domain, connecting atomic concepts dynamically in context using inline wiki links (e.g., `[[Binary-Search-Algorithm]]`, `[[mid-Formula-and-Overflow]]`).

A high quality Core Note contains:
1. **Curriculum/Domain Roadmap:** Visual architecture or pipeline connecting all concepts.
2. **Context & Motivation:** What problem this lecture or module solves.
3. **Concept Connections:** Deep narrative paragraphs linking atomic notes in logical order.
4. **Summary & Takeaways:** Key mental models, interview tips, and common pitfalls.

---

## Red Flags & Strict Rules
1. **NEVER use invalid or broken Mermaid syntax:** Always test that node IDs, brackets, and arrow targets are balanced.
2. **NEVER leave truncated or mangled code:** All code must be complete, formatted with correct spacing, keywords, and types.
3. **NEVER use broken markdown tables:** Ensure all rows have matching column pipes `| Col 1 | Col 2 |`.
4. **NEVER create orphan notes:** Every atomic note must backlink to its parent Core Note.
5. **NEVER use absolute file system paths in links:** Always use relative links or Obsidian double brackets `[[note-title]]`.

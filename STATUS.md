# DSA Tracker — Project Status

**Stack:** Next.js 14 + Tailwind CSS + MongoDB (Mongoose) + NextAuth (Google/GitHub OAuth) + tldraw + Monaco Editor + Fuse.js

**Location:** `/Users/abhisheksingh/Desktop/NewSelfProject/dsa-tracker/`

---

## ✅ DONE

| #  | Item                      | Files                                                                                      |
|----|---------------------------|-------------------------------------------------------------------------------------------|
| 1  | Next.js + Tailwind + TS   | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs` |
| 2  | Dependencies installed    | mongoose, next-auth, @tldraw/tldraw, fuse.js, jspdf, html2canvas, @monaco-editor/react, lucide-react |
| 3  | Environment variables     | `.env.local` — MongoDB URI, Google OAuth creds (GitHub + NextAuth Secret are placeholders) |
| 4  | MongoDB connection        | `src/lib/mongodb.ts` — cached connection with Mongoose                                     |
| 5  | Mongoose models (5)       | `src/models/User.ts`, `Problem.ts`, `Assignment.ts`, `StudentProgress.ts`, `CanvasNote.ts` |
| 6  | NextAuth config           | `src/lib/auth.ts` — Google + GitHub providers, signIn callback creates user, session adds `id` + `role` |
| 7  | API routes (8 endpoints)  | See table below                                                                           |
| 8  | Problem lists from user   | 17 topics provided (raw text in conversation)                                             |

### API Routes Created

| Method  | Route                          | Description                              |
|---------|--------------------------------|------------------------------------------|
| POST/GET| `/api/auth/[...nextauth]`     | NextAuth handler                         |
| PATCH   | `/api/user/role`              | Update user role (teacher/student)       |
| GET     | `/api/problems`               | List problems with filters               |
| GET     | `/api/assignments`            | List assignments (role-based)            |
| POST    | `/api/assignments`            | Create assignment (teacher only)         |
| GET/PATCH/DELETE | `/api/assignments/[id]` | Single assignment CRUD                   |
| GET/POST| `/api/progress`               | Get/save student progress                |
| GET/POST| `/api/canvas`                 | List/create canvas notes                 |
| GET/PATCH/DELETE | `/api/canvas/[id]`    | Single canvas note CRUD                  |

---

## ❌ PENDING

| #  | Item                    | Description                                                                                   |
|----|-------------------------|-----------------------------------------------------------------------------------------------|
| 1  | Problem dataset         | `src/data/problems.ts` — Parse user-provided lists into `{title, link, difficulty, topic}[]`, deduplicate by link |
| 2  | Seed script             | `src/scripts/seed.ts` — Insert problems into MongoDB (`npm run seed`)                         |
| 3  | Root layout             | `src/app/layout.tsx` — SessionProvider, ThemeProvider, global CSS                             |
| 4  | Global CSS              | `src/app/globals.css` — Tailwind directives, dark mode classes                                |
| 5  | Auth pages              | `src/app/auth/signin/page.tsx` — Google/GitHub login + role selection                         |
| 6  | Sidebar + Shell         | `src/components/Sidebar.tsx` — Nav: Dashboard, Problems, Assignments, Canvas; role badge; dark mode toggle; user avatar |
| 7  | Dashboard page          | `src/app/dashboard/page.tsx` — Stats cards (total solved, by difficulty, topic), progress bars |
| 8  | Problems page           | `src/app/problems/page.tsx` — Full list: topic filter, difficulty filter, search (substring + fuzzy via Fuse.js), solved checkbox, open link |
| 9  | Problem detail          | `src/app/problems/[id]/page.tsx` — Monaco code editor, language selector, notes/hints textarea, save to DB |
| 10 | Assignments list        | `src/app/assignments/page.tsx` — Teacher: list + create button. Student: assigned list        |
| 11 | Create assignment       | `src/app/assignments/create/page.tsx` — Pick problems, title/description, PDF attachments, due date, pick students |
| 12 | Assignment detail       | `src/app/assignments/[id]/page.tsx` — View problems, mark solved, code/notes, PDF viewer      |
| 13 | Canvas list             | `src/app/canvas/page.tsx` — List canvas notes (create/open/delete)                            |
| 14 | Canvas editor           | `src/app/canvas/[id]/page.tsx` — tldraw: layers, shapes, undo/redo, text section, PDF export, save to DB |
| 15 | ThemeProvider            | `src/components/ThemeProvider.tsx` — Dark/light toggle (class strategy)                       |
| 16 | SessionProvider wrapper | `src/components/Providers.tsx` — Wraps NextAuth SessionProvider                               |
| 17 | Middleware              | `src/middleware.ts` — Redirect unauthenticated → signin, no role → role selection             |
| 18 | TypeScript types        | `src/types/index.ts` — Interfaces for Problem, Assignment, User, Progress, CanvasNote         |
| 19 | Lint + typecheck        | `npm run lint` and `npm run typecheck`, fix all errors                                        |

---

## 📋 USER-PROVIDED PROBLEM LISTS

17 topic lists provided. Each problem has `{difficulty, title, link}`. Some problems appear in multiple topics — deduplicate by link.

| Topic                    | Raw Count |
|--------------------------|-----------|
| Dynamic Programming      | 45        |
| Greedy                   | 34        |
| Graphs                   | 32        |
| Backtracking             | 17        |
| Linked List              | 13        |
| Bit Manipulation         | 21        |
| Hash Table               | 46        |
| DSU / Union-Find         | 25        |
| Sliding Window           | 12        |
| Trie                     | 8         |
| Heap / Priority Queue    | 13        |
| Heaps (extra)            | 22        |
| Trees Top 26             | 27        |
| Trees Top 74 Part 1      | 21        |
| Trees Top 74 Part 2      | 30        |
| Binary Search            | 25        |
| Two Pointers             | 30        |

**Total raw: ~420 entries → ~350+ unique after dedup**

---

## 🗂️ PROJECT STRUCTURE (Target)

```
dsa-tracker/
├── .env.local                              ✅
├── package.json                            ✅
├── tsconfig.json                           ✅
├── next.config.ts                          ✅
├── tailwind.config.ts                      ✅
├── postcss.config.mjs                      ✅
├── src/
│   ├── app/
│   │   ├── layout.tsx                      ❌
│   │   ├── globals.css                     ❌
│   │   ├── page.tsx                        ❌ (redirect to dashboard)
│   │   ├── auth/
│   │   │   └── signin/page.tsx             ❌
│   │   ├── dashboard/page.tsx              ❌
│   │   ├── problems/
│   │   │   ├── page.tsx                    ❌
│   │   │   └── [id]/page.tsx               ❌
│   │   ├── assignments/
│   │   │   ├── page.tsx                    ❌
│   │   │   ├── create/page.tsx             ❌
│   │   │   └── [id]/page.tsx               ❌
│   │   ├── canvas/
│   │   │   ├── page.tsx                    ❌
│   │   │   └── [id]/page.tsx               ❌
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts         ✅
│   │       ├── user/role/route.ts                  ✅
│   │       ├── problems/route.ts                   ✅
│   │       ├── assignments/route.ts                ✅
│   │       ├── assignments/[id]/route.ts           ✅
│   │       ├── progress/route.ts                   ✅
│   │       ├── canvas/route.ts                     ✅
│   │       └── canvas/[id]/route.ts                ✅
│   ├── components/
│   │   ├── Providers.tsx                   ❌
│   │   ├── ThemeProvider.tsx                ❌
│   │   ├── Sidebar.tsx                     ❌
│   │   ├── ProblemTable.tsx                ❌
│   │   ├── AssignmentCard.tsx              ❌
│   │   ├── CodeEditor.tsx                  ❌
│   │   ├── CanvasEditor.tsx                ❌
│   │   └── StatsCard.tsx                   ❌
│   ├── data/
│   │   └── problems.ts                     ❌
│   ├── lib/
│   │   ├── mongodb.ts                      ✅
│   │   └── auth.ts                         ✅
│   ├── models/
│   │   ├── User.ts                         ✅
│   │   ├── Problem.ts                      ✅
│   │   ├── Assignment.ts                   ✅
│   │   ├── StudentProgress.ts              ✅
│   │   └── CanvasNote.ts                   ✅
│   ├── scripts/
│   │   └── seed.ts                         ❌
│   └── types/
│       └── index.ts                        ❌
```

---

## 📌 KEY CONTEXT FOR NEXT AGENT

1. **Problem lists are raw text** in the conversation history — parse into `{title, link, difficulty, topic}[]` and deduplicate by link
2. **No UI exists yet** — every page and component needs to be built from scratch
3. **tldraw v4.5.4** — import as `import { Tldraw } from '@tldraw/tldraw'`, needs `'use client'`, import CSS `'tldraw/tldraw.css'`
4. **Monaco Editor** (`@monaco-editor/react`) — code saving per problem
5. **Fuse.js** — fuzzy search on the problems page
6. **Dark mode** — Tailwind `class` strategy, toggle adds/removes `dark` on `<html>`
7. **NextAuth session** includes `user.id` and `user.role` (added via callbacks in `src/lib/auth.ts`)
8. **Teacher can:** create assignments, upload PDF attachments (base64 in MongoDB), create canvas notes, share with students, track progress
9. **Student can:** view assignments, mark solved, save code/notes/hints per problem, view shared canvas notes
10. **GitHub OAuth credentials are placeholders** — needs `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and proper `NEXTAUTH_SECRET`

---

## 🚀 COMMANDS

```bash
cd /Users/abhisheksingh/Desktop/NewSelfProject/dsa-tracker

# Build all files first, then:
npm run seed        # Populate MongoDB with problems
npm run dev         # Start dev server on localhost:3000
npm run lint        # Check for lint errors
npm run typecheck   # Check TypeScript errors
```

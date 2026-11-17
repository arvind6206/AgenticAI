# Polish & Fix Chapter — What We Changed

This chapter adds **no new features**. We fixed bugs, finished half-done things, and cleaned up the code.

---

## 1. The project didn't build

| Problem | Fix |
| --- | --- |
| TypeScript error in `app/(auth)/layout.tsx` | Used plain `{ children: React.ReactNode }` instead of `LayoutProps<"/login">` |
| TypeScript error in `components/ui/spinner.tsx` | Removed the conflicting `strokeWidth` prop type |
| Lint error in `hooks/use-mobile.ts` (setState inside useEffect) | Rewrote it with `useSyncExternalStore` |
| 20+ `any` types | Replaced them with real types |

**Lesson:** run `npx tsc --noEmit` and `pnpm lint` often. If they fail, `next build` fails too.

---

## 2. The LangGraph workflow was never used

In Chapter 8 we wrote `compileWorkflow()`, but the chat never called it.

**Fix:** `runAgentStream()` now builds the graph and runs it:

```
User message → Start node → Agent node → End node → Reply
```

- Fixed the filename typo: `compile-worflow.ts` → `compile-workflow.ts`
- The graph is checked by `validateGraph()` before it runs. So if you delete an edge, you get a clear error message.
- The run stops when it takes longer than the agent's time limit (`timeoutMs`)

---

## 3. The Memory toggle did nothing

The agent always got the old chat history, even when memory was off.

**Fix:** with memory **ON** the agent sees earlier messages. With memory **OFF** every message starts fresh.

---

## 4. "Streaming" chat wasn't really streaming

The whole reply arrived at the end in one piece.

**Fix:** we now use `model.stream()`, so text appears word by word, like ChatGPT.

---

## 5. Errors were handled badly

| Before | After |
| --- | --- |
| On a failure, a fake "No response" message was saved to the database | Errors are thrown and shown in the chat as a **red bubble**. Nothing fake is saved. |
| A network failure left the chat stuck on "loading" forever | The error is caught and shown |
| An empty message crashed the API | The API checks the request with **zod** first |

---

## 6. Chat panel fixes (`chat-panel.tsx`)

- Tool badges (e.g. "Weather …" → "Weather ✓") now show **while** a tool runs, not only at the end
- The chat auto-scrolls to the newest message
- It always tests your **latest canvas**, including unsaved changes

---

## 7. Builder fixes

- **Clicking a node opens its settings.** Before, you had to click "Settings" yourself.
- **"Unsaved changes" was wrong.** It showed up right after opening a page, because React Flow sends "select" and "resize" events. Now only real edits count, and editing the name or description counts too.
- **Leaving with unsaved work.** You now get a warning when you close the tab or click Back.
- **Save** shows a success or error toast, and the button is disabled when there's nothing to save.
- The Start and End nodes got their own icons (▶️ and 🏁) instead of the default robot.

---

## 8. Small UX fixes

- `/` was a leftover test page. It now goes to `/agents`.
- The logo on the login page linked to a 404 page. Fixed.
- The browser tab title said "Create Next App". It now says "Agent Builder".
- **Delete agent** now asks "Are you sure?" first.
- Agent cards show "Updated 5 minutes ago".
- Creating or deleting an agent shows a toast if it fails.
- A theme toggle (light/dark) is now in the sidebar.

---

## 9. Safer data

- New agents are saved in the **V2 graph format**. Templates are converted automatically.
- `saveAgent` checks the data with zod before saving. Server actions are public endpoints, so never trust the input.
- **Custom tool names are cleaned up.** OpenAI only allows `a-z 0-9 _ -`, so "My Tool!" becomes `my_tool`. The settings panel shows the final name.
- The model list only has models that support tools.

---

## 10. Easier setup for new students

- Renamed `prisma7.config.ts` → `prisma.config.ts` (the name Prisma looks for)
- Added `.env.example`, which lists every key you need
- New scripts:
  - `pnpm install`: also runs `prisma generate` automatically
  - `pnpm db:migrate`: creates the database tables
  - `pnpm db:studio`: lets you browse the database

---

## 11. Deleted code nobody used

- `agent-settings-form.tsx`, `sign-out-button.tsx`, `lib/auth-client.ts`
- Old V1 canvas nodes: `memory-node.tsx`, `model-node.tsx`, `tool-node.tsx`
- Unused functions: `updateAgent`, `builderToAgentDefinition`, `canvasToAgentDefinition`, `getCanvasJson`, `getAgentToolBadges`

**Lesson:** dead code confuses the next person who reads it. Delete it.

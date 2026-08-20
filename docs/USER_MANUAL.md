# Akili User Manual

This guide is for people using the Akili desktop app to ask questions, search documents, and get Accela help in chat.

## What Akili is

Akili is a desktop chat app. You create a **workspace**, add documents, and talk to an AI that can use those documents plus Accela-specific assistants.

It is not Accela itself. It does not log into Civic Platform for you. Use it to draft SQL, scripts, configuration checklists, and explanations, then apply the result in Accela with your normal process.

## Open the app

1. Launch **Akili** from the Start menu or desktop shortcut.
2. The first time, you may be asked to pick an AI provider and create a workspace.
3. After setup, you land on your workspaces.

If chat does not respond, open **Settings → AI Providers → AI Models** and confirm both the **LLM** (chat model) and the **Embedder** (document search model) are saved.

## Workspaces

A workspace is a project folder for chats and documents. Use one workspace per agency, ticket area, or topic so answers stay focused.

- Create a workspace from the left sidebar.
- Open a workspace to chat.
- Threads (if you use them) keep side conversations inside the same workspace.

## Chat

1. Open a workspace.
2. Type your question in the box at the bottom and press Enter or the send button.
3. Attach a spec, screenshot, or SQL file when the question depends on it.

Tips:

- Be specific: agency, record type, portlet, and what you need (SQL, script, config steps).
- If the answer should follow Accela standards, say so. The workspace **system prompt** already carries org rules; keep it in place.
- Use `@agent` when you want Akili to run an Accela assistant (report, scripting, or configuration) instead of a plain chat reply.

## Documents and knowledge

Upload the files the assistant should use: specs, cheatsheets, sample SQL, scripting guides, fee schedules.

1. Open the workspace.
2. Open workspace documents / upload.
3. Add files and wait until they finish embedding.

The **embedder** turns files into searchable text. If you switch embedder later, existing documents may need to be re-embedded.

If Akili says it could not find sources, confirm the file is in **this** workspace and finished embedding.

## Accela assistants

Akili ships three assistants. They show under **Settings → Agent Skills → Agent Flows**. Leave them **On**.

They work **with** the workspace system prompt. The system prompt stays; each assistant adds domain rules on top.

- **Accela Report Assistant** — specs, business analysis, SQL, SSRS, Crystal Reports
- **Accela Scripting Assistant** — EMSE JavaScript, Script Test, workflow/fee script logic
- **Accela Configuration Assistant** — fee schedules, RFEEITEM, standard choices, config validation

How to use them:

1. Open a workspace that has your Accela documents uploaded.
2. In chat, start with `@agent` and describe the task.
3. Ask in the language of the assistant you need, for example “write SQL for this spec” or “Script Test this WTUB validation”.

The agent picks the matching flow from the description. You can also open a flow in Agent Skills to read what it does or turn it off.

## AI Models

**Settings → AI Providers → AI Models** is one page with two choices:

- **LLM** — the model that writes answers.
- **Embedding model** — the model that searches your documents.

You still need both. They are just on the same screen. Changing the embedder can reset existing document embeddings; confirm the warning if you see it.

## Settings you will actually use

- **AI Models** — LLM and embedder (above).
- **Agent Skills** — Accela assistants and other agent tools.
- **Workspaces** (from the sidebar) — rename, members, chat settings, **system prompt**. Do not delete the Accela system prompt unless you mean to.
- **Interface / Branding** — appearance.

You do not need Community Hub, API keys, or experimental features for everyday Accela chat.

## Keyboard shortcuts

Press the keyboard shortcuts help key in the app (shown in the shortcuts panel) to see the current list. Common actions include focusing chat and opening settings.

## If something looks empty

- **No agent flows listed** — restart Akili. Built-in Accela assistants are created on startup if they are missing.
- **Chat has no sources** — upload and embed documents in the workspace you are using.
- **Model errors** — reopen AI Models and save valid credentials for both LLM and embedder.

## More detail for builders

The file `docs/SCRIPTING_AGENT_FLOW_SETUP.md` in the project repo explains how the Accela flows are built. Everyday use does not require that setup; the three assistants are already visible in the app.

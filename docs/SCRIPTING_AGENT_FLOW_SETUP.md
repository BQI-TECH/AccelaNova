# Akili Accela Agent Flows

Akili ships three Accela assistants. They are created on startup and listed under **Settings → Agent Skills → Agent Flows**. Leave them **On**.

They work **with** the workspace system prompt. Do not replace the system prompt; each flow adds domain rules on top.

| Flow name in the UI | Domain |
|---------------------|--------|
| **Accela Report Assistant** | Specs, business analysis, SQL, SSRS, Crystal Reports |
| **Accela Scripting Assistant** | EMSE JavaScript, Script Test, workflow/fee script logic |
| **Accela Configuration Assistant** | Fee schedules, RFEEITEM, standard choices, config validation |

Everyday use: in chat, start with `@agent` and describe the task. The agent selects the matching flow.

You only need the builder steps below if you are copying a flow by hand or restoring one after deleting it.

---

## Manual rebuild (optional)

### 1. Flow Information

Use one of the names in the table above. Description should tell the agent **when** to invoke the flow (and when not to).

### 2. Flow Variables (Start block)

| Variable name   | Initial value | Description |
|-----------------|---------------|-------------|
| `user_request`  | *(empty)*     | The user's question or task. Passed when the flow is called. |

### 3. LLM Instruction block

**Direct output:** **ON**. Result variable: any name (for example `assistant_response`).

Paste a domain instruction that:

- Says it works alongside the workspace system prompt
- Encodes the knowledge-base rules for that domain
- Ends with `USER REQUEST:` and `${user_request}`

Canonical sources:

- Report / business analysis: `ai-centralized-knowledgebase/Report Development/.cursor/rules/accela-report-development.mdc`
- Scripting: `ai-centralized-knowledgebase/Scripting/.cursor/rules/accela-scripting.mdc`
- Configuration: `ai-centralized-knowledgebase/Configuration/` (fee schedule and RFEEITEM guides)

Built-in instruction text lives in `server/utils/agentFlows/builtinFlows.js`.

### 4. Flow Complete

Keep the default **Flow Complete** block.

### 5. Publish and use

1. **Save**, then keep the flow **On**.
2. Use the workspace that contains your Accela knowledge base documents.
3. In chat, `@agent` plus a report, scripting, or configuration request will invoke the matching flow.

---

## Quick reference – knowledge base sources

| Doc | Use for |
|-----|--------|
| ACCELA AUTOMATION SQL CHEAT SHEET | Joins, SERV_PROV_CODE, REC_STATUS, primary record logic, SSRS |
| Data Dictionary (Lydia Lim) | Field-to-table/column mapping, naming |
| Civic Platform 23.2 / 24.2 Scripting Guide | EMSE functions, events, script-driven execution |
| Function Reference Guide | FN_GET_* and DB functions |
| Accela ERDB Training DB Schema | Schema, DDL, table/keys |
| Fee Schedule Configuration and Validation Guide | RFEEITEM, upsert, validation Script Tests |

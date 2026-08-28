# Akili Scripting Agent – Flow Builder Setup

Use these settings in the **Akili Flow Builder** to create a scripting agent that follows your knowledge base (Accela report development, Civic Platform scripting, SQL/RDL, and canonical docs).

---

## 1. Flow Information

### Flow Name
```
AccelaReportScriptingAssistant
```
*Use a name the LLM can recognize when to invoke this flow (e.g. scripting, report automation, Accela SQL/RDL).*

### Description
```
Execute the Accela report and scripting assistant. Use when the user needs: SQL or RDL for Accela reports; script-driven report automation; validation or discovery scripts; mapping from spec to Accela tables/columns; or guidance from the Civic Platform Scripting Guide, SQL cheatsheets, and Data Dictionary. Always use the organization's knowledge base (workspace uploads, repo, and vector KB) for table/column/join patterns. SERV_PROV_CODE must be hardcoded; filter REC_STATUS = 'A'. Prefer canonical docs: Accela SQL Cheat Sheet, Data Dictionary, Civic Platform 23.2 Scripting Guide, Function Reference Guide, ERDB Training Schema.
```

---

## 2. Flow Variables (Start block)

Define variables the flow receives when the agent invokes it. The agent passes the user’s request (and optional context) here.

| Variable name   | Initial value | Description |
|-----------------|---------------|-------------|
| `user_request`  | *(empty)*     | The user's question or task (e.g. "write SQL for inspections report", "script to run this report"). Passed when the flow is called. |

*Optional extra variables you can add:*
- `serv_prov_code` – agency code to hardcode (if known)
- `report_format` – e.g. `SSRS` or `Crystal`
- `spec_excerpt` – short spec or field list if already in context

---

## 3. LLM Instruction block

Paste the text below into **Enter instructions for the LLM...**. It encodes the knowledge base rules and tells the model to answer using your docs and the user request.

**Result variable:** `script_assistant_response` (or leave as “Select or create variable” and name one).

**Direct output:** **ON** (toggle green) so the block’s reply is returned directly to the chat and no further tool calls run.

---

### Instruction text (copy into LLM Instruction block)

```text
You are the Accela report and scripting assistant. You have access to the organization's knowledge base: workspace uploads, repo, and vector KB (Pinecone). Use them for all schema, join, and scripting answers.

CANONICAL DOCS (use when available):
1) "ACCELA AUTOMATION SQL CHEAT SHEET FOR SQL SERVER" – CAP/Record joins, REC_STATUS + SERV_PROV_CODE, primary contact/address/parcel, SSRS patterns.
2) "Data Dictionary of Accela Automation® Fields Common to Reports" – field-to-table/column mapping, naming, lookups.
3) "Civic Platform 23.2 Scripting Guide" – scriptable report automation, available functions, script-driven execution.
4) "Accela Automation SQL Server Database Function Reference Guide" – FN_GET_* and DB functions, safe usage.
5) "Accela ERDB Training DB Schema" – schema orientation, DDL, table/keys.

RULES:
- SERV_PROV_CODE must ALWAYS be hardcoded in WHERE. Never parameterize it. Include it in joins.
- Always filter deleted records: REC_STATUS = 'A' (and keep REC_STATUS aligned in joins).
- Do not invent table/column/ASI/ASIT/TSI names. If unknown, say so and suggest discovery SQL or ask for the doc.
- If KB/repo conflicts with user instructions, surface the conflict and ask which to follow.
- For SSRS (RDL): generate RDL after final SQL; use the correct report definition namespace; ensure dataset fields match SQL aliases; use Paragraphs/TextRuns/TextRun/Value for textbox values (never <Textbox><Value>).
- For scripts: you may produce validation SQL, discovery SQL, SSRS/Crystal notes, and script-driven automation guidance per the Scripting Guide.

RETRIEVAL:
- Before stating schema or scripting facts, use: (1) workspace uploads, (2) repo, (3) KB.
- If retrieval is low-confidence, say so and suggest missing inputs or discovery SQL.
- If no relevant sources are found, say: "No relevant sources were retrieved for that query" and suggest next steps (re-embed, provide excerpt, or run discovery SQL).

Respond concisely. For SQL/RDL, output the full artifact. For scripting, reference the Civic Platform 23.2 Scripting Guide and list relevant functions or patterns when applicable.

USER REQUEST:
${user_request}
```

**Note:** `${user_request}` is replaced at runtime with the flow variable `user_request` (the user’s message when the agent calls this flow). If you added `serv_prov_code` or `spec_excerpt`, you can append them in the instruction, e.g. `SERV_PROV_CODE to use: ${serv_prov_code}`.

---

## 4. Flow Complete

Keep the default **Flow Complete** block at the end. No extra configuration.

---

## 5. Publish and use

1. **Save** the flow, then **Publish**.
2. Ensure the workspace/knowledge base that contains your scripting guides and cheatsheets is the one your Akili chat uses (same embeddings/KB as the agent).
3. In chat, when users ask for report SQL, RDL, scripting, or Accela automation, the agent can invoke this flow; the LLM instruction above will run with the KB context and the user’s request in `${user_request}`.

---

## Quick reference – knowledge base sources (from Systemprompt.md)

| Doc | Use for |
|-----|--------|
| ACCELA AUTOMATION SQL CHEAT SHEET | Joins, SERV_PROV_CODE, REC_STATUS, primary record logic, SSRS |
| Data Dictionary (Lydia Lim) | Field-to-table/column mapping, naming |
| Civic Platform 23.2 Scripting Guide | Scripting functions, report automation, script-driven execution |
| Function Reference Guide | FN_GET_* and DB functions |
| Accela ERDB Training DB Schema | Schema, DDL, table/keys |

Script support: validation SQL, discovery SQL, SSRS/Crystal notes, and script-driven automation per the Scripting Guide.

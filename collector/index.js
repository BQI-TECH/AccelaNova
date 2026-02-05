// Load env only when not packaged as desktop app. Skip silently if dotenv is unavailable.
(function loadEnv() {
  const isDesktop = String(process.env.DESKTOP_APP).toLowerCase() === "true";
  if (isDesktop) return;
  try {
    const pathArg =
      process.env.NODE_ENV === "development" ?
        { path: `.env.${process.env.NODE_ENV}` } :
        undefined;
    require("dotenv").config(pathArg);
  } catch (_) {
    // dotenv may not be installed in packaged runs; ignore.
  }
})();

require("./utils/logger")();
const express = require("express");
// Prefer built-in express parsers and fallback cors shim to reduce deps in desktop
// const bodyParser = require("body-parser");
const cors = (() => {
  try {
    return require("cors");
  } catch (_) {
    return require("./utils/corsShim");
  }
})();
const path = require("path");
const { ACCEPTED_MIMES } = require("./utils/constants");
const { reqBody } = require("./utils/http");
const { processSingleFile } = require("./processSingleFile");
const { processLink, getLinkText } = require("./processLink");
const { wipeCollectorStorage } = require("./utils/files");
const extensions = require("./extensions");
const { processRawText } = require("./processRawText");
const { verifyPayloadIntegrity } = require("./middleware/verifyIntegrity");
const app = express();
const FILE_LIMIT = "3GB";

app.use(cors({ origin: true }));
app.use(express.text({ limit: FILE_LIMIT }));
app.use(express.json({ limit: FILE_LIMIT }));
app.use(
  express.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

app.post(
  "/process", [verifyPayloadIntegrity],
  async function (request, response) {
    const { filename, options = {}, metadata = {} } = reqBody(request);
    try {
      const targetFilename = path
        .normalize(filename)
        .replace(/^(\.\.(\/|\\|$))+/, "");
      const {
        success,
        reason,
        documents = [],
      } = await processSingleFile(targetFilename, options, metadata);
      response
        .status(200)
        .json({ filename: targetFilename, success, reason, documents });
    } catch (e) {
      console.error(e);
      response.status(200).json({
        filename: filename,
        success: false,
        reason: "A processing error occurred.",
        documents: [],
      });
    }
    return;
  }
);

app.post(
  "/parse", [verifyPayloadIntegrity],
  async function (request, response) {
    const { filename, options = {} } = reqBody(request);
    try {
      const targetFilename = path
        .normalize(filename)
        .replace(/^(\.\.(\/|\\|$))+/, "");
      const {
        success,
        reason,
        documents = [],
      } = await processSingleFile(targetFilename, {
        ...options,
        parseOnly: true,
      });
      response
        .status(200)
        .json({ filename: targetFilename, success, reason, documents });
    } catch (e) {
      console.error(e);
      response.status(200).json({
        filename: filename,
        success: false,
        reason: "A processing error occurred.",
        documents: [],
      });
    }
    return;
  }
);

app.post(
  "/process-link", [verifyPayloadIntegrity],
  async function (request, response) {
    const { link, scraperHeaders = {}, metadata = {} } = reqBody(request);
    try {
      const {
        success,
        reason,
        documents = [],
      } = await processLink(link, scraperHeaders, metadata);
      response.status(200).json({ url: link, success, reason, documents });
    } catch (e) {
      console.error(e);
      response.status(200).json({
        url: link,
        success: false,
        reason: "A processing error occurred.",
        documents: [],
      });
    }
    return;
  }
);

app.post(
  "/util/get-link", [verifyPayloadIntegrity],
  async function (request, response) {
    const { link, captureAs = "text" } = reqBody(request);
    try {
      const { success, content = null } = await getLinkText(link, captureAs);
      response.status(200).json({ url: link, success, content });
    } catch (e) {
      console.error(e);
      response.status(200).json({
        url: link,
        success: false,
        content: null,
      });
    }
    return;
  }
);

app.post(
  "/process-raw-text", [verifyPayloadIntegrity],
  async function (request, response) {
    const { textContent, metadata } = reqBody(request);
    try {
      const {
        success,
        reason,
        documents = [],
      } = await processRawText(textContent, metadata);
      response
        .status(200)
        .json({
          filename: metadata?.title || "Unknown-doc.txt",
          success,
          reason,
          documents,
        });
    } catch (e) {
      console.error(e);
      response.status(200).json({
        filename: metadata?.title || "Unknown-doc.txt",
        success: false,
        reason: "A processing error occurred.",
        documents: [],
      });
    }
    return;
  }
);

extensions(app);

app.get("/accepts", function (_, response) {
  response.status(200).json(ACCEPTED_MIMES);
});

app.all("*", function (_, response) {
  response.sendStatus(200);
});

const collectorPort = process.env.COLLECTOR_PORT || 8888;
app
  .listen(collectorPort, async () => {
    await wipeCollectorStorage();
    console.log(`Document processor app listening on port ${collectorPort}`);
  })
  .on("error", function (err) {
    console.error(`Collector server error: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${collectorPort} is already in use`);
    }
    process.once("SIGUSR2", function () {
      process.kill(process.pid, "SIGUSR2");
    });
    process.on("SIGINT", function () {
      process.kill(process.pid, "SIGINT");
    });
  });
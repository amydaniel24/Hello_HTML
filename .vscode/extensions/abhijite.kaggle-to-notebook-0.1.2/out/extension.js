"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var import_child_process = require("child_process");
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
function activate(context) {
  console.log('Extension "Kaggle to Notebook" is now active!');
  let disposable = vscode.commands.registerCommand("kaggle-to-notebook.fetchKaggleNotebook", async () => {
    try {
      const url = await vscode.window.showInputBox({
        prompt: "Enter the Kaggle Notebook URL",
        placeHolder: "https://www.kaggle.com/code/username/notebook-slug"
      });
      if (!url) {
        vscode.window.showErrorMessage("No URL provided. Please enter a valid Kaggle notebook URL.");
        return;
      }
      const match = url.match(/https:\/\/www\.kaggle\.com\/code\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        vscode.window.showErrorMessage("Invalid Kaggle notebook URL.");
        return;
      }
      const username = match[1];
      const slug = match[2];
      const selectedFolder = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: "Select folder to save notebook"
      });
      const outputPath = selectedFolder ? selectedFolder[0].fsPath : path.join(vscode.workspace.rootPath || __dirname, "notebooks");
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      const command = `kaggle kernels pull ${username}/${slug} -p "${outputPath}" --metadata `;
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Fetching Kaggle Notebook...",
        cancellable: false
      }, async () => {
        try {
          await execPromise(command);
          const notebookPath = path.join(outputPath, `${slug}.ipynb`);
          if (!fs.existsSync(notebookPath)) {
            vscode.window.showErrorMessage(`Notebook not found at: ${notebookPath}`);
            return;
          }
          const doc = await vscode.workspace.openTextDocument(notebookPath);
          vscode.window.showTextDocument(doc);
          vscode.window.showInformationMessage("Kaggle notebook fetched successfully!");
          vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(outputPath));
        } catch (error) {
          handleError(error, "Failed to fetch Kaggle notebook.");
        }
      });
    } catch (error) {
      handleError(error, "Unexpected error while fetching the Kaggle notebook.");
    }
  });
  context.subscriptions.push(disposable);
}
function deactivate() {
}
function execPromise(command) {
  return new Promise((resolve, reject) => {
    (0, import_child_process.exec)(command, (error, stdout, stderr) => {
      if (error) {
        if (stderr.includes("403")) {
          reject(new Error("This notebook is private. Please log in to Kaggle and ensure your API token is valid."));
        } else {
          reject(new Error(`Failed to pull notebook: ${stderr || error.message}`));
        }
        return;
      }
      console.log(stdout);
      resolve();
    });
  });
}
function handleError(error, defaultMessage) {
  console.error("Error:", error);
  if (error instanceof Error) {
    vscode.window.showErrorMessage(error.message || defaultMessage);
  } else {
    vscode.window.showErrorMessage(defaultMessage);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});

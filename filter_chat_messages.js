const fs = require("fs");
const path = require("path");

function usage() {
  console.log(`
Usage:
  node filter_chat_messages.js <input-json-txt> [output-json] [output-txt]

Example:
  node filter_chat_messages.js "C:\\Users\\ah112\\Documents\\New Text Document.txt" --fix-mojibake

By default this keeps user and assistant messages from the active conversation path.
Use --include-system if you also want system/tool/developer messages.
Use --fix-mojibake if Arabic text appears like Ø§Ù„ÙƒÙ„Ø§Ù….
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const includeSystem = args.includes("--include-system");
  const fixMojibake = args.includes("--fix-mojibake");
  const flags = new Set(["--include-system", "--fix-mojibake"]);
  const positional = args.filter((arg) => !flags.has(arg));

  if (positional.length < 1 || positional.includes("--help") || positional.includes("-h")) {
    usage();
    process.exit(positional.length < 1 ? 1 : 0);
  }

  const input = positional[0];
  const baseName = path.basename(input, path.extname(input)).replace(/[^\w.-]+/g, "_");
  const outputJson = positional[1] || path.resolve(process.cwd(), `${baseName}_filtered_messages.json`);
  const outputTxt = positional[2] || path.resolve(process.cwd(), `${baseName}_filtered_messages.txt`);

  return { input, outputJson, outputTxt, includeSystem, fixMojibake };
}

function repairMojibake(text) {
  if (!/[ØÙÃÂâð]/.test(text)) return text;

  const repaired = Buffer.from(text, "latin1").toString("utf8");
  const arabicCount = (value) => (value.match(/[\u0600-\u06ff]/g) || []).length;
  const mojibakeCount = (value) => (value.match(/[ØÙÃÂâð]/g) || []).length;

  if (arabicCount(repaired) > arabicCount(text)) return repaired;
  if (mojibakeCount(repaired) < mojibakeCount(text) && !/�/.test(repaired)) return repaired;

  return text;
}

function getTextFromContent(content, fixMojibake) {
  if (!content) return "";

  if (Array.isArray(content.parts)) {
    const text = content.parts
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") return JSON.stringify(part);
        return "";
      })
      .filter(Boolean)
      .join("\n");

    return fixMojibake ? repairMojibake(text) : text;
  }

  if (typeof content.text === "string") {
    return fixMojibake ? repairMojibake(content.text) : content.text;
  }
  if (typeof content.result === "string") {
    return fixMojibake ? repairMojibake(content.result) : content.result;
  }

  return "";
}

function getActivePath(mapping, currentNode) {
  const pathIds = [];
  let nodeId = currentNode;
  const seen = new Set();

  while (nodeId && mapping[nodeId] && !seen.has(nodeId)) {
    seen.add(nodeId);
    pathIds.push(nodeId);
    nodeId = mapping[nodeId].parent;
  }

  return pathIds.reverse();
}

function extractMessages(data, includeSystem, fixMojibake) {
  const mapping = data.mapping || {};
  const ids = data.current_node ? getActivePath(mapping, data.current_node) : Object.keys(mapping);
  const allowedRoles = includeSystem ? null : new Set(["user", "assistant"]);

  return ids
    .map((id) => {
      const message = mapping[id] && mapping[id].message;
      if (!message) return null;

      const sender = message.author && message.author.role ? message.author.role : "unknown";
      if (allowedRoles && !allowedRoles.has(sender)) return null;

      const text = getTextFromContent(message.content, fixMojibake).trim();
      if (!text) return null;

      return {
        sender,
        message: text,
        create_time: message.create_time || null,
      };
    })
    .filter(Boolean);
}

function toReadableText(messages) {
  return messages
    .map((item, index) => {
      const header = `[${index + 1}] ${item.sender.toUpperCase()}`;
      return `${header}\n${item.message}`;
    })
    .join("\n\n---\n\n");
}

function main() {
  const { input, outputJson, outputTxt, includeSystem, fixMojibake } = parseArgs(process.argv);
  const data = JSON.parse(fs.readFileSync(input, "utf8"));
  const messages = extractMessages(data, includeSystem, fixMojibake);

  fs.writeFileSync(outputJson, JSON.stringify(messages, null, 2), "utf8");
  fs.writeFileSync(outputTxt, toReadableText(messages), "utf8");

  console.log(`Saved ${messages.length} messages`);
  console.log(`JSON: ${outputJson}`);
  console.log(`TXT:  ${outputTxt}`);
}

main();

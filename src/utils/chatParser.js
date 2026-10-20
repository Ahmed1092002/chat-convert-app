/**
 * Browser-compatible Mojibake repair for Arabic & multilingual UTF-8 decoded as Windows-1252/Latin-1
 */
const CP1252_MAP = {
  0x80: 0x20AC, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E,
  0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02C6,
  0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152,
  0x8E: 0x017D, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C,
  0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A,
  0x9C: 0x0153, 0x9E: 0x017E, 0x9F: 0x0178
};

// Reverse map from Unicode code point to Windows-1252 byte
const REVERSE_CP1252 = new Map();
for (const [byteStr, code] of Object.entries(CP1252_MAP)) {
  REVERSE_CP1252.set(code, Number(byteStr));
}

export function repairMojibake(text) {
  if (!text || typeof text !== 'string') return text || '';
  if (!/[ØÙÃÂâð]/.test(text)) return text;

  try {
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code <= 0xff) {
        bytes.push(code);
      } else if (REVERSE_CP1252.has(code)) {
        bytes.push(REVERSE_CP1252.get(code));
      } else {
        bytes.push(code & 0xff);
      }
    }

    const decoder = new TextDecoder('utf-8', { fatal: false });
    const repaired = decoder.decode(new Uint8Array(bytes));

    const arabicCount = (val) => (val.match(/[\u0600-\u06ff]/g) || []).length;
    const mojibakeCount = (val) => (val.match(/[ØÙÃÂâð]/g) || []).length;

    if (arabicCount(repaired) > arabicCount(text)) return repaired;
    if (mojibakeCount(repaired) < mojibakeCount(text) && !/\uFFFD/.test(repaired)) return repaired;

    return text;
  } catch {
    return text;
  }
}

/**
 * Strips raw GenUI / custom tags if fallbackMarkdown wasn't available
 */
function cleanGenUiTags(str) {
  if (!str) return '';
  return str
    .replace(/<box[^>]*>/gi, '')
    .replace(/<\/box>/gi, '\n')
    .replace(/<grid[^>]*>/gi, '')
    .replace(/<\/grid>/gi, '\n')
    .replace(/<grid-item[^>]*>/gi, '')
    .replace(/<\/grid-item>/gi, '\n')
    .replace(/<row[^>]*>/gi, '')
    .replace(/<\/row>/gi, '\n')
    .replace(/<text[^>]*>/gi, '')
    .replace(/<\/text>/gi, '\n')
    .replace(/<icon[^>]*\/>/gi, '')
    .replace(/<divider[^>]*\/>/gi, '\n---\n')
    .replace(/\{@body[^\}]*\}/gi, '')
    .replace(/<radio-group[^>]*>[\s\S]*?<\/radio-group>/gi, '')
    .replace(/\{#if[^\}]*\}[\s\S]*?\{\/if\}/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getTextFromContent(content, fixMojibake) {
  if (!content) return "";

  if (Array.isArray(content.parts)) {
    const text = content.parts
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          if (typeof part.text === "string") return part.text;
          return JSON.stringify(part);
        }
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

export function getActivePath(mapping, currentNode) {
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

/**
 * Extracts a normalized single message item from various format flavors
 */
function normalizeMessageItem(item, fixMojibake) {
  if (!item) return null;

  let sender = 'unknown';
  if (item.author && item.author.role) {
    sender = item.author.role;
  } else if (item.sender) {
    sender = item.sender === 'human' ? 'user' : item.sender;
  } else if (item.role) {
    sender = item.role;
  }

  // Handle reasoning recap (e.g. "Worked for 5s")
  const isReasoning = item.content && item.content.content_type === 'reasoning_recap';

  let text = '';
  // Check if fallback markdown is available in metadata (ChatGPT GenUI)
  if (item.metadata?.model_dil_v2?.fallbackMarkdown) {
    text = item.metadata.model_dil_v2.fallbackMarkdown;
  } else if (item.content) {
    if (typeof item.content === 'string') {
      text = item.content;
    } else if (item.content.content) {
      text = item.content.content;
    } else {
      text = getTextFromContent(item.content, fixMojibake);
    }
  } else if (typeof item.message === 'string') {
    text = item.message;
  } else if (typeof item.text === 'string') {
    text = item.text;
  }

  if (fixMojibake) {
    text = repairMojibake(text);
  }

  // If text contains JSX box/grid tags, clean them
  if (text.includes('<box') || text.includes('<icon') || text.includes('__dil')) {
    text = cleanGenUiTags(text);
  }

  return {
    id: item.id || item.uuid || Math.random().toString(36).substring(2, 9),
    sender,
    isReasoning,
    message: text.trim(),
    create_time: item.create_time || item.created_at || item.timestamp || null,
  };
}

/**
 * Extracts messages from a single ChatGPT conversation object with `mapping`
 */
export function extractFromConversation(convo, { includeSystem = false, fixMojibake = false, onlyActive = true } = {}) {
  const mapping = convo.mapping || {};
  const ids = (convo.current_node && onlyActive)
    ? getActivePath(mapping, convo.current_node)
    : Object.keys(mapping);

  const allowedRoles = includeSystem ? null : new Set(["user", "assistant"]);

  const messages = ids
    .map((id) => {
      const messageObj = mapping[id] && mapping[id].message;
      if (!messageObj) return null;

      const norm = normalizeMessageItem(messageObj, fixMojibake);
      if (!norm) return null;
      if (norm.isReasoning && !includeSystem) return null;
      if (allowedRoles && !allowedRoles.has(norm.sender)) return null;
      if (!norm.message) return null;

      return {
        id: norm.id,
        sender: norm.sender,
        message: norm.message,
        create_time: norm.create_time,
      };
    })
    .filter(Boolean);

  return {
    id: convo.id || convo.conversation_id || Math.random().toString(36).substring(2, 9),
    title: convo.title ? (fixMojibake ? repairMojibake(convo.title) : convo.title) : "Conversation",
    create_time: convo.create_time || null,
    messages,
  };
}

/**
 * Extracts messages from an object with a `messages` array
 */
function extractFromMessagesArray(convoObj, messagesArray, { includeSystem = false, fixMojibake = false } = {}) {
  const allowedRoles = includeSystem ? null : new Set(["user", "assistant"]);

  const messages = messagesArray
    .map((item) => {
      const norm = normalizeMessageItem(item, fixMojibake);
      if (!norm) return null;
      if (norm.isReasoning && !includeSystem) return null;
      if (allowedRoles && !allowedRoles.has(norm.sender)) return null;
      if (!norm.message) return null;

      return {
        id: norm.id,
        sender: norm.sender,
        message: norm.message,
        create_time: norm.create_time,
      };
    })
    .filter(Boolean);

  return {
    id: convoObj?.conversation_id || convoObj?.id || Math.random().toString(36).substring(2, 9),
    title: convoObj?.title ? (fixMojibake ? repairMojibake(convoObj.title) : convoObj.title) : "Conversation",
    create_time: convoObj?.create_time || null,
    messages,
  };
}

/**
 * Generic parser that handles ChatGPT export, single convo, Claude, or simple JSON array
 */
export function parseChatData(parsedJson, options = {}) {
  const { includeSystem = false, fixMojibake = false, onlyActive = true } = options;

  // Case 1: Array of conversations or array of messages
  if (Array.isArray(parsedJson)) {
    if (parsedJson.length === 0) return [];

    // Subcase 1A: ChatGPT conversation array: [ { title, mapping, current_node }, ... ]
    if (parsedJson[0]?.mapping) {
      return parsedJson.map((convo) => extractFromConversation(convo, { includeSystem, fixMojibake, onlyActive }));
    }

    // Subcase 1B: Conversations array with messages list: [ { title, messages: [...] }, ... ]
    if (parsedJson[0]?.messages && Array.isArray(parsedJson[0].messages)) {
      return parsedJson.map((convo) => extractFromMessagesArray(convo, convo.messages, { includeSystem, fixMojibake }));
    }

    // Subcase 1C: Claude conversations array: [ { name, chat_messages: [...] }, ... ]
    if (parsedJson[0]?.chat_messages) {
      return parsedJson.map((convo, idx) => {
        return extractFromMessagesArray(
          { title: convo.name || `Claude Chat ${idx + 1}`, id: convo.uuid, create_time: convo.created_at },
          convo.chat_messages,
          { includeSystem, fixMojibake }
        );
      });
    }

    // Subcase 1D: Simple messages array: [ { author/sender/role, content/message/text }, ... ]
    return [extractFromMessagesArray(
      { title: "Imported Messages", create_time: Date.now() / 1000 },
      parsedJson,
      { includeSystem, fixMojibake }
    )];
  }

  // Case 2: Single conversation object
  if (parsedJson && typeof parsedJson === 'object') {
    // 2A: Standard ChatGPT object with mapping
    if (parsedJson.mapping) {
      return [extractFromConversation(parsedJson, { includeSystem, fixMojibake, onlyActive })];
    }

    // 2B: Wrapper object: { conversation: { mapping } }
    if (parsedJson.conversation?.mapping) {
      return [extractFromConversation(parsedJson.conversation, { includeSystem, fixMojibake, onlyActive })];
    }

    // 2C: Single ChatGPT / API object with messages array (e.g. { title, messages: [...] })
    if (Array.isArray(parsedJson.messages)) {
      return [extractFromMessagesArray(parsedJson, parsedJson.messages, { includeSystem, fixMojibake })];
    }

    // 2D: Claude single conversation: { name, chat_messages: [...] }
    if (Array.isArray(parsedJson.chat_messages)) {
      return [extractFromMessagesArray(
        { title: parsedJson.name || "Claude Conversation", create_time: parsedJson.created_at },
        parsedJson.chat_messages,
        { includeSystem, fixMojibake }
      )];
    }
  }

  throw new Error("Unrecognized chat JSON structure. Please ensure it is a ChatGPT or Claude export file.");
}

/**
 * Format helpers
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  try {
    const date = typeof timestamp === "number" ? new Date(timestamp * 1000) : new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleString();
  } catch {
    return "";
  }
}

export function toReadableText(messages) {
  return messages
    .map((item, index) => {
      const timeStr = item.create_time ? ` (${formatTimestamp(item.create_time)})` : "";
      const header = `[${index + 1}] ${item.sender.toUpperCase()}${timeStr}`;
      return `${header}\n${item.message}`;
    })
    .join("\n\n---\n\n");
}

export function toCleanJson(messages) {
  return JSON.stringify(
    messages.map(({ sender, message, create_time }) => ({
      sender,
      message,
      create_time,
    })),
    null,
    2
  );
}

export function toMarkdown(messages, title = "Conversation") {
  const parts = [`# ${title}\n`];
  messages.forEach((item, index) => {
    const isUser = item.sender === "user";
    const icon = isUser ? "👤" : item.sender === "assistant" ? "🤖" : "⚙️";
    const roleName = item.sender.charAt(0).toUpperCase() + item.sender.slice(1);
    const timeStr = item.create_time ? ` *(${formatTimestamp(item.create_time)})*` : "";
    parts.push(`### ${icon} ${roleName} [#${index + 1}]${timeStr}\n\n${item.message}\n\n---`);
  });
  return parts.join("\n\n");
}

export function toHtmlDocument(messages, title = "Conversation") {
  const renderedMessages = messages
    .map((item, index) => {
      const isUser = item.sender === "user";
      const bg = isUser ? "#f0fdf4" : "#f8fafc";
      const border = isUser ? "#86efac" : "#cbd5e1";
      const color = isUser ? "#166534" : "#1e293b";
      const icon = isUser ? "👤 User" : item.sender === "assistant" ? "🤖 Assistant" : "⚙️ System";
      const timeStr = item.create_time ? `<span style="font-size: 12px; opacity: 0.7; font-weight: normal;"> • ${formatTimestamp(item.create_time)}</span>` : "";

      const escaped = item.message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      return `
      <div style="margin-bottom: 24px; padding: 18px 24px; background: ${bg}; border: 1px solid ${border}; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-weight: 600; color: ${color};">
          <span>${icon} #${index + 1}${timeStr}</span>
        </div>
        <div style="white-space: pre-wrap; line-height: 1.6; color: #1e293b; font-size: 15px;">${escaped}</div>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html dir="auto">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      max-width: 900px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
    }
    h1 {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 28px;
    }
    @media print {
      body { background: white; margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${renderedMessages}
</body>
</html>`;
}

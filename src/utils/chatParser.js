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
        // Fallback to latin1 truncation if applicable
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
 * Extracts messages from a single ChatGPT conversation object
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

      const sender = messageObj.author && messageObj.author.role ? messageObj.author.role : "unknown";
      if (allowedRoles && !allowedRoles.has(sender)) return null;

      const text = getTextFromContent(messageObj.content, fixMojibake).trim();
      if (!text) return null;

      return {
        id,
        sender,
        message: text,
        create_time: messageObj.create_time || null,
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
 * Generic parser that handles ChatGPT export, single convo, Claude, or simple JSON array
 */
export function parseChatData(parsedJson, options = {}) {
  const { includeSystem = false, fixMojibake = false, onlyActive = true } = options;

  // Case 1: ChatGPT full export array: [ { title, mapping, current_node }, ... ]
  if (Array.isArray(parsedJson)) {
    // Check if it's ChatGPT conversation array
    if (parsedJson.length > 0 && parsedJson[0] && parsedJson[0].mapping) {
      return parsedJson.map((convo) => extractFromConversation(convo, { includeSystem, fixMojibake, onlyActive }));
    }

    // Check if Claude conversations array
    if (parsedJson.length > 0 && parsedJson[0] && parsedJson[0].chat_messages) {
      return parsedJson.map((convo, idx) => {
        const msgs = (convo.chat_messages || []).map((m, mIdx) => ({
          id: m.uuid || `msg-${mIdx}`,
          sender: m.sender === 'human' ? 'user' : (m.sender === 'assistant' ? 'assistant' : m.sender || 'unknown'),
          message: fixMojibake ? repairMojibake(m.text || '') : (m.text || ''),
          create_time: m.created_at || null,
        })).filter(m => includeSystem || m.sender === 'user' || m.sender === 'assistant');

        return {
          id: convo.uuid || `convo-${idx}`,
          title: convo.name || `Claude Chat ${idx + 1}`,
          create_time: convo.created_at || null,
          messages: msgs,
        };
      });
    }

    // Check if simple messages array: [ { sender/role, message/content } ]
    const sample = parsedJson[0];
    if (sample && (sample.sender || sample.role) && (sample.message || sample.content || sample.text)) {
      const msgs = parsedJson.map((item, idx) => {
        const sender = item.sender || item.role || 'user';
        let rawContent = item.message || item.content || item.text || '';
        if (typeof rawContent === 'object') {
          rawContent = getTextFromContent(rawContent, fixMojibake);
        } else if (fixMojibake) {
          rawContent = repairMojibake(rawContent);
        }
        return {
          id: item.id || `msg-${idx}`,
          sender,
          message: String(rawContent).trim(),
          create_time: item.create_time || item.timestamp || null,
        };
      }).filter(m => includeSystem || m.sender === 'user' || m.sender === 'assistant');

      return [{
        id: 'imported-chat',
        title: 'Imported Messages',
        create_time: Date.now() / 1000,
        messages: msgs,
      }];
    }
  }

  // Case 2: Single ChatGPT conversation object: { title, mapping, current_node }
  if (parsedJson && typeof parsedJson === 'object') {
    if (parsedJson.mapping) {
      return [extractFromConversation(parsedJson, { includeSystem, fixMojibake, onlyActive })];
    }

    // If wrapped in { conversation: { mapping } } or { data: { mapping } }
    if (parsedJson.conversation && parsedJson.conversation.mapping) {
      return [extractFromConversation(parsedJson.conversation, { includeSystem, fixMojibake, onlyActive })];
    }

    // If object with messages array: { messages: [...] }
    if (Array.isArray(parsedJson.messages)) {
      return parseChatData(parsedJson.messages, options);
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

      // Escape HTML
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

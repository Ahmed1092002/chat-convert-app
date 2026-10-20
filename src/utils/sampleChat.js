export const SAMPLE_CHAT = {
  "title": "استفسار عن تطوير وتصدير المحادثات البرمجية",
  "create_time": 1715697600,
  "current_node": "node-3",
  "mapping": {
    "node-root": {
      "id": "node-root",
      "message": null,
      "parent": null,
      "children": ["node-1"]
    },
    "node-1": {
      "id": "node-1",
      "parent": "node-root",
      "children": ["node-2"],
      "message": {
        "id": "msg-1",
        "author": { "role": "user" },
        "create_time": 1715697615,
        "content": {
          "parts": [
            "مرحباً! كيف يمكنني استخراج المحادثات من شات جي بي تي وتحويلها إلى ملف نصي منسق أو JSON؟"
          ]
        }
      }
    },
    "node-2": {
      "id": "node-2",
      "parent": "node-1",
      "children": ["node-3"],
      "message": {
        "id": "msg-2",
        "author": { "role": "assistant" },
        "create_time": 1715697625,
        "content": {
          "parts": [
            "أهلاً بك! يمكنك تصدير بياناتك بالكامل من إعدادات ChatGPT عبر خيار 'Export data'.\n\nستحصل على ملف مضغوط يحتوي على `conversations.json`. بعد ذلك يمكنك استخدام هذه الأداة لتحويلها إلى:\n1. ملف نصي منظم (TXT)\n2. ملف JSON نقي\n3. مستند Markdown\n4. صفحة HTML جاهزة للطباعة والحفظ\n\nكما تدعم الأداة إصلاح مشاكل الترميز (Mojibake) للنصوص العربية تلقائياً!"
          ]
        }
      }
    },
    "node-3": {
      "id": "node-3",
      "parent": "node-2",
      "children": [],
      "message": {
        "id": "msg-3",
        "author": { "role": "user" },
        "create_time": 1715697690,
        "content": {
          "parts": [
            "ممتاز جداً! شكراً لك."
          ]
        }
      }
    }
  }
};

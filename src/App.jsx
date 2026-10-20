import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  FileText,
  FileJson,
  Download,
  Copy,
  Check,
  Moon,
  Sun,
  Languages,
  Upload,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Trash2,
  HelpCircle,
  Layers,
  Bot,
  User,
  Sliders,
  Share2
} from 'lucide-react';
import {
  parseChatData,
  toReadableText,
  toCleanJson,
  toMarkdown,
  toHtmlDocument,
  formatTimestamp
} from './utils/chatParser';
import { SAMPLE_CHAT } from './utils/sampleChat';

const DICT = {
  ar: {
    appTitle: "محول وفلترة محادثات ChatGPT",
    subtitle: "استخرج ونظّف محادثات الذكاء الاصطناعي مع إصلاح الترميز العربي وتصدير إلى TXT و JSON و Markdown",
    dragDropText: "اسحب ملف المحادثة هنا أو اضغط للاختيار",
    dragDropSubtext: "يدعم ملفات JSON و TXT المصدرة من ChatGPT أو Claude",
    pasteTab: "أو الصق النص مباشرة",
    fileTab: "رفع ملف",
    pastePlaceholder: "الصق محتوى JSON أو نص المحادثة هنا...",
    processBtn: "معالجة وتحويل",
    loadSampleBtn: "تجربة نموذج محادثة",
    clearBtn: "إعادة ضبط",
    optionsTitle: "خيارات التصفية والمعالجة",
    fixMojibake: "إصلاح تشوه ترميز اللغة العربية (Mojibake)",
    fixMojibakeDesc: "يعالج النصوص التي تظهر برموز غريبة مثل Ø§Ù„ÙƒÙ„Ø§Ù…",
    includeSystem: "تضمين رسائل النظام والمطور (System & Tools)",
    includeSystemDesc: "إظهار أوامر النظام واستدعاءات الدوال البرمجية",
    onlyActivePath: "المسار الفعال للمحادثة فقط (Active Branch)",
    onlyActivePathDesc: "تجاهل الردود القديمة التي تم تعديلها أو تفريعها",
    searchPlaceholder: "بحث في نص الرسائل...",
    tabs: {
      chat: "معاينة المحادثة",
      text: "نص منسق (TXT)",
      json: "بيانات (JSON)",
      markdown: "ماركداون (MD)"
    },
    downloadTxt: "تحميل TXT",
    downloadJson: "تحميل JSON",
    downloadMd: "تحميل Markdown",
    downloadHtml: "تحميل HTML",
    copyAll: "نسخ للكل",
    copied: "تم النسخ!",
    copyMsg: "نسخ الرسالة",
    stats: {
      total: "إجمالي الرسائل",
      user: "رسائل المستخدم",
      assistant: "ردود المساعد",
      words: "عدد الكلمات",
      chars: "عدد الحروف"
    },
    conversationsList: "المحادثات الموجودة في الملف",
    selectConvo: "اختر محادثة لعرضها",
    noMessagesFound: "لم يتم العثور على رسائل تطابق خيارات التصفية أو البحث.",
    uploadPromptTitle: "ابدأ برفع ملف المحادثة",
    uploadPromptDesc: "يمكنك رفع ملف JSON المصدر من ChatGPT (مثل conversations.json) أو لصق النص البرمجي مباشرة للبدء في المعاينة والتحميل.",
    privacyNote: "🔒 معالجة آمنة بنسبة 100%: جميع العمليات تتم محلياً داخل متصفحك ولا يتم إرسال أي ملفات إلى أي خادم خارجي.",
    howToTitle: "كيف تصدر محادثاتك من ChatGPT؟",
    howToStep1: "1. افتح ChatGPT واضغط على صورة حسابك في الأسفل.",
    howToStep2: "2. اختر الإعدادات (Settings) ثم عناصر التحكم في البيانات (Data Controls).",
    howToStep3: "3. اضغط على تصدير البيانات (Export data) وستصلك رسالة بريد إلكتروني تحتوي على ملف مضغوط.",
    howToStep4: "4. افتح الملف المضغوط واسحب ملف conversations.json إلى هذه الأداة مباشرة!",
    msgRoleUser: "المستخدم",
    msgRoleAssistant: "المساعد الذكي",
    msgRoleSystem: "النظام",
  },
  en: {
    appTitle: "ChatGPT Chat Converter & Filter",
    subtitle: "Extract, clean, and format AI chats with Arabic Mojibake repair and export to TXT, JSON, and Markdown",
    dragDropText: "Drop your chat file here, or click to browse",
    dragDropSubtext: "Supports JSON & TXT exports from ChatGPT or Claude",
    pasteTab: "Or Paste Raw Text",
    fileTab: "Upload File",
    pastePlaceholder: "Paste your JSON export or chat content here...",
    processBtn: "Process & Convert",
    loadSampleBtn: "Load Demo Chat",
    clearBtn: "Reset",
    optionsTitle: "Processing & Filter Options",
    fixMojibake: "Fix Arabic Mojibake Encoding",
    fixMojibakeDesc: "Repairs corrupted Arabic characters like Ø§Ù„ÙƒÙ„Ø§Ù… into clean text",
    includeSystem: "Include System & Tool Messages",
    includeSystemDesc: "Show system instructions and developer tool calls",
    onlyActivePath: "Active Path Only (Linear Branch)",
    onlyActivePathDesc: "Follow only the chosen branch, ignoring edited prior branches",
    searchPlaceholder: "Search message text...",
    tabs: {
      chat: "Chat View",
      text: "Formatted TXT",
      json: "Clean JSON",
      markdown: "Markdown"
    },
    downloadTxt: "Download TXT",
    downloadJson: "Download JSON",
    downloadMd: "Download Markdown",
    downloadHtml: "Download HTML",
    copyAll: "Copy All",
    copied: "Copied!",
    copyMsg: "Copy message",
    stats: {
      total: "Total Messages",
      user: "User Messages",
      assistant: "Assistant Replies",
      words: "Words",
      chars: "Characters"
    },
    conversationsList: "Conversations in File",
    selectConvo: "Select conversation",
    noMessagesFound: "No messages match your search or filter settings.",
    uploadPromptTitle: "Start by Uploading a Chat File",
    uploadPromptDesc: "Upload your exported ChatGPT JSON file (e.g. conversations.json) or paste content directly to convert and export.",
    privacyNote: "🔒 100% Private & Client-side: All processing happens entirely inside your browser. No data leaves your device.",
    howToTitle: "How to export conversations from ChatGPT?",
    howToStep1: "1. Go to ChatGPT and click your profile at the bottom.",
    howToStep2: "2. Open Settings, then go to Data Controls.",
    howToStep3: "3. Click Export Data. You will receive an email with a zip file.",
    howToStep4: "4. Extract the zip and drop conversations.json right here!",
    msgRoleUser: "User",
    msgRoleAssistant: "Assistant",
    msgRoleSystem: "System",
  }
};

export default function App() {
  const [lang, setLang] = useState('ar');
  const [darkMode, setDarkMode] = useState(true);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [rawParsedData, setRawParsedData] = useState(null);

  // Settings
  const [fixMojibake, setFixMojibake] = useState(true);
  const [includeSystem, setIncludeSystem] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'text' | 'json' | 'markdown'
  const [selectedConvoIndex, setSelectedConvoIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const t = DICT[lang];

  // Toggle dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Update dir attribute based on language
  useEffect(() => {
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  // Parse raw data whenever options or rawParsedData change
  const parsedConversations = useMemo(() => {
    if (!rawParsedData) return [];
    try {
      const result = parseChatData(rawParsedData, {
        fixMojibake,
        includeSystem,
        onlyActive,
      });
      return result;
    } catch (err) {
      console.error(err);
      return [];
    }
  }, [rawParsedData, fixMojibake, includeSystem, onlyActive]);

  const currentConversation = parsedConversations[selectedConvoIndex] || parsedConversations[0] || null;

  // Filter messages by search query
  const filteredMessages = useMemo(() => {
    if (!currentConversation || !currentConversation.messages) return [];
    if (!searchQuery.trim()) return currentConversation.messages;

    const q = searchQuery.toLowerCase();
    return currentConversation.messages.filter((msg) =>
      msg.message.toLowerCase().includes(q) || msg.sender.toLowerCase().includes(q)
    );
  }, [currentConversation, searchQuery]);

  // Calculated stats
  const stats = useMemo(() => {
    if (!filteredMessages.length) return null;
    let userCount = 0;
    let assistantCount = 0;
    let totalChars = 0;
    let totalWords = 0;

    filteredMessages.forEach((m) => {
      if (m.sender === 'user') userCount++;
      else if (m.sender === 'assistant') assistantCount++;
      totalChars += m.message.length;
      totalWords += m.message.split(/\s+/).filter(Boolean).length;
    });

    return {
      total: filteredMessages.length,
      userCount,
      assistantCount,
      totalWords,
      totalChars,
    };
  }, [filteredMessages]);

  const handleProcessRawText = (text, name = 'custom_input.json') => {
    setErrorMessage('');
    try {
      const parsed = JSON.parse(text);
      setRawParsedData(parsed);
      setFileName(name);
      setSelectedConvoIndex(0);
    } catch (err) {
      setErrorMessage(
        lang === 'ar'
          ? "تعذر تحليل الملف كـ JSON صحيح. يرجى التأكد من أن الملف بصيغة JSON سليمة."
          : "Invalid JSON format. Please verify the file is a valid JSON file."
      );
    }
  };

  const handleFileUpload = (file) => {
    if (!file) return;
    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      handleProcessRawText(content, file.name);
    };
    reader.onerror = () => {
      setErrorMessage(
        lang === 'ar' ? "حدث خطأ أثناء قراءة الملف." : "Error reading file."
      );
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = () => {
    setRawParsedData(SAMPLE_CHAT);
    setFileName("chatgpt_sample_arabic.json");
    setSelectedConvoIndex(0);
    setErrorMessage('');
  };

  const handleReset = () => {
    setRawParsedData(null);
    setPastedText('');
    setFileName('');
    setSearchQuery('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (content, ext, mimeType) => {
    if (!filteredMessages.length) return;
    const baseName = (fileName ? fileName.replace(/\.[^/.]+$/, "") : "chat_export")
      .replace(/[^\w\u0600-\u06FF.-]+/g, "_");
    const downloadName = `${baseName}_filtered.${ext}`;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Pre-generate views for tabs
  const textOutput = useMemo(() => {
    return filteredMessages.length ? toReadableText(filteredMessages) : "";
  }, [filteredMessages]);

  const jsonOutput = useMemo(() => {
    return filteredMessages.length ? toCleanJson(filteredMessages) : "";
  }, [filteredMessages]);

  const markdownOutput = useMemo(() => {
    return filteredMessages.length ? toMarkdown(filteredMessages, currentConversation?.title) : "";
  }, [filteredMessages, currentConversation]);

  const htmlOutput = useMemo(() => {
    return filteredMessages.length ? toHtmlDocument(filteredMessages, currentConversation?.title) : "";
  }, [filteredMessages, currentConversation]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                ChatGPT &bull; Claude &bull; JSON &bull; TXT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition"
              title="تجربة محادثة نموذجية"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.loadSampleBtn}</span>
            </button>

            {rawParsedData && (
              <button
                onClick={handleReset}
                className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                title={t.clearBtn}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
              title="تغيير اللغة / Switch Language"
            >
              <Languages className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title="وضع العرض"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
            <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600 text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Input / Upload Section */}
        {!rawParsedData ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition">
            <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {t.uploadPromptTitle}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>{t.fileTab}</span>
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
                    inputMode === 'paste'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>{t.pasteTab}</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Area */}
            {inputMode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/70 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {t.dragDropText}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t.dragDropSubtext}
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    conversations.json
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    chat_export.txt
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={t.pastePlaceholder}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleProcessRawText(pastedText, "pasted_conversation.json")}
                    disabled={!pastedText.trim()}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.processBtn}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Guarantee Banner */}
            <div className="mt-8 p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 text-center">
              {t.privacyNote}
            </div>

            {/* How-to guide */}
            <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-500" />
                <span>{t.howToTitle}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  {t.howToStep1}
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  {t.howToStep2}
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  {t.howToStep3}
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                  {t.howToStep4}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Processed & Active Conversation View */
          <div className="space-y-6">
            {/* Control Bar: File info, Filter switches, Search */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                      {currentConversation?.title || fileName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {fileName} &bull; {currentConversation?.create_time ? formatTimestamp(currentConversation.create_time) : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>ملف آخر</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.clearBtn}</span>
                  </button>
                </div>
              </div>

              {/* Multiple conversations selector if array */}
              {parsedConversations.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {t.conversationsList} ({parsedConversations.length}):
                  </span>
                  {parsedConversations.map((convo, idx) => (
                    <button
                      key={convo.id || idx}
                      onClick={() => setSelectedConvoIndex(idx)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
                        selectedConvoIndex === idx
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{convo.title || `Chat #${idx + 1}`}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedConvoIndex === idx ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {convo.messages.length}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Filter Toggles & Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Mojibake repair */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={fixMojibake}
                    onChange={(e) => setFixMojibake(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t.fixMojibake}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      {t.fixMojibakeDesc}
                    </span>
                  </div>
                </label>

                {/* Include System */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={includeSystem}
                    onChange={(e) => setIncludeSystem(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t.includeSystem}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      {t.includeSystemDesc}
                    </span>
                  </div>
                </label>

                {/* Only active path */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition select-none">
                  <input
                    type="checkbox"
                    checked={onlyActive}
                    onChange={(e) => setOnlyActive(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      {t.onlyActivePath}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      {t.onlyActivePathDesc}
                    </span>
                  </div>
                </label>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full py-2.5 pl-9 pr-4 rtl:pl-4 rtl:pr-9 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Statistics Row */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {t.stats.total}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.total}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {t.stats.user}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.userCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {t.stats.assistant}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.assistantCount}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {t.stats.words}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.totalWords.toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {t.stats.chars}
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {stats.totalChars.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar (Export & Copy buttons) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
              {/* Tab Selector */}
              <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'chat'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t.tabs.chat}
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'text'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t.tabs.text}
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'json'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t.tabs.json}
                </button>
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'markdown'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t.tabs.markdown}
                </button>
              </div>

              {/* Downloads & Copy */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const toCopy = activeTab === 'json' ? jsonOutput : (activeTab === 'markdown' ? markdownOutput : textOutput);
                    copyToClipboard(toCopy, 'currentTab');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
                >
                  {copiedKey === 'currentTab' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'currentTab' ? t.copied : t.copyAll}</span>
                </button>

                <button
                  onClick={() => downloadFile(textOutput, 'txt', 'text/plain;charset=utf-8')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadTxt}</span>
                </button>

                <button
                  onClick={() => downloadFile(jsonOutput, 'json', 'application/json;charset=utf-8')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadJson}</span>
                </button>

                <button
                  onClick={() => downloadFile(markdownOutput, 'md', 'text/markdown;charset=utf-8')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadMd}</span>
                </button>

                <button
                  onClick={() => downloadFile(htmlOutput, 'html', 'text/html;charset=utf-8')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadHtml}</span>
                </button>
              </div>
            </div>

            {/* Display Area */}
            {filteredMessages.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm">{t.noMessagesFound}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                {/* 1. Chat Bubble View */}
                {activeTab === 'chat' && (
                  <div className="space-y-6">
                    {filteredMessages.map((item, idx) => {
                      const isUser = item.sender === 'user';
                      const isAssistant = item.sender === 'assistant';

                      return (
                        <div
                          key={item.id || idx}
                          className={`flex items-start gap-3 sm:gap-4 ${
                            isUser ? 'flex-row' : 'flex-row'
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-sm ${
                              isUser
                                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                                : isAssistant
                                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500'
                                : 'bg-gradient-to-tr from-amber-600 to-orange-500'
                            }`}
                          >
                            {isUser ? <User className="w-4 h-4" /> : isAssistant ? <Bot className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
                          </div>

                          {/* Message Body */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                  {isUser ? t.msgRoleUser : isAssistant ? t.msgRoleAssistant : item.sender.toUpperCase()}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  #{idx + 1}
                                </span>
                                {item.create_time && (
                                  <span className="text-[11px] text-slate-400">
                                    &bull; {formatTimestamp(item.create_time)}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => copyToClipboard(item.message, `msg-${idx}`)}
                                className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title={t.copyMsg}
                              >
                                {copiedKey === `msg-${idx}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div
                              className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border ${
                                isUser
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-slate-900 dark:text-slate-100'
                                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {item.message}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Text View */}
                {activeTab === 'text' && (
                  <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words overflow-x-auto text-slate-800 dark:text-slate-200 max-h-[700px] overflow-y-auto">
                    {textOutput}
                  </pre>
                )}

                {/* 3. JSON View */}
                {activeTab === 'json' && (
                  <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words overflow-x-auto text-emerald-700 dark:text-emerald-400 max-h-[700px] overflow-y-auto">
                    {jsonOutput}
                  </pre>
                )}

                {/* 4. Markdown View */}
                {activeTab === 'markdown' && (
                  <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words overflow-x-auto text-slate-800 dark:text-slate-200 max-h-[700px] overflow-y-auto">
                    {markdownOutput}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AI Chat Converter &bull; Client-side &bull; Open Source</span>
          <span>Ready for Vercel Deployment</span>
        </div>
      </footer>
    </div>
  );
}

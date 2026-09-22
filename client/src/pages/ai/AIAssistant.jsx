
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  BrainCircuit,
  ChevronRight,
  CircleAlert,
  Clock3,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from "lucide-react";

import api from "../../services/api";

const suggestedQuestions = [
  {
    icon: Wallet,
    title: "Outstanding amount",
    question: "How much money is still outstanding?",
  },
  {
    icon: User,
    title: "Top clients",
    question: "Which clients owe me the most money?",
  },
  {
    icon: Clock3,
    title: "Overdue invoices",
    question: "Show me my overdue invoices.",
  },
  {
    icon: BrainCircuit,
    title: "Business summary",
    question: "Give me a summary of my business performance.",
  },
];

const formatTime = (date) => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
};

const createMessage = (role, content) => ({
  id: `${role}-${Date.now()}-${Math.random()}`,
  role,
  content,
  timestamp: new Date(),
});

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendQuestion = async (questionText) => {
    const trimmedQuestion = questionText.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setErrorMessage("");

    const userMessage = createMessage(
      "user",
      trimmedQuestion
    );

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await api.post("/ai/chat", {
        question: trimmedQuestion,
      });

      const answer =
        response.data?.answer ||
        "The AI assistant did not return a response.";

      const assistantMessage = createMessage(
        "assistant",
        answer
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch (error) {
      console.error(
        "AI Assistant Error:",
        error
      );

      const message =
        error.response?.data?.message ||
        "Unable to connect to the AI assistant. Please try again.";

      setErrorMessage(message);
    } finally {
      setLoading(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await sendQuestion(question);
  };

  const handleKeyDown = async (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      await sendQuestion(question);
    }
  };

  const clearConversation = () => {
    if (loading) {
      return;
    }

    setMessages([]);
    setQuestion("");
    setErrorMessage("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const showWelcome =
    messages.length === 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/20">
              <Sparkles
                size={23}
                className="text-white"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  AI Business Assistant
                </h1>

                <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 sm:inline-flex">
                  Live
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-400">
                Ask questions about your invoices,
                payments and business performance.
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-red-400/20 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={16} />
              Clear conversation
            </button>
          )}
        </div>

        {/* ==========================================
            MAIN CONTENT
        ========================================== */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0d1424] shadow-2xl shadow-black/20">
          {/* ========================================
              CHAT HEADER
          ======================================== */}

          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
                <Bot
                  size={21}
                  className="text-violet-300"
                />

                <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d1424] bg-emerald-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  InvoiceAI Assistant
                </p>

                <p className="text-xs text-slate-500">
                  Powered by your business data
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 sm:flex">
              <CircleAlert size={14} />
              Answers use your verified invoice data
            </div>
          </div>

          {/* ========================================
              CHAT AREA
          ======================================== */}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
            {showWelcome ? (
              <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 ring-1 ring-violet-400/20">
                    <BrainCircuit
                      size={31}
                      className="text-violet-300"
                    />
                  </div>

                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    How can I help with your business?
                  </h2>

                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                    Ask natural-language questions about
                    your invoices, collections, clients,
                    outstanding payments and business
                    performance.
                  </p>
                </div>

                {/* Suggested Questions */}

                <div className="grid gap-3 sm:grid-cols-2">
                  {suggestedQuestions.map(
                    (item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.question}
                          type="button"
                          onClick={() =>
                            sendQuestion(
                              item.question
                            )
                          }
                          disabled={loading}
                          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-violet-400/25 hover:bg-violet-500/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                            <Icon
                              size={19}
                              className="text-violet-300"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-200">
                              {item.title}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {item.question}
                            </p>
                          </div>

                          <ChevronRight
                            size={17}
                            className="shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300"
                          />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-6">
                {messages.map((message) => {
                  const isUser =
                    message.role === "user";

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        isUser
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                          <Bot
                            size={18}
                            className="text-violet-300"
                          />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] ${
                          isUser
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                            isUser
                              ? "rounded-br-md bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-900/20"
                              : "rounded-bl-md border border-white/10 bg-white/[0.04] text-slate-200"
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        </div>

                        <p
                          className={`mt-1.5 px-1 text-[10px] text-slate-600 ${
                            isUser
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {formatTime(
                            message.timestamp
                          )}
                        </p>
                      </div>

                      {isUser && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700/60">
                          <User
                            size={17}
                            className="text-slate-300"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                      <Bot
                        size={18}
                        className="text-violet-300"
                      />
                    </div>

                    <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.04] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />

                        <span className="ml-2 text-xs text-slate-500">
                          Analyzing your business data...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                      <CircleAlert
                        size={18}
                        className="text-red-400"
                      />
                    </div>

                    <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-red-400/15 bg-red-500/[0.06] px-4 py-3">
                      <p className="text-sm leading-6 text-red-200">
                        {errorMessage}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage("");
                          textareaRef.current?.focus();
                        }}
                        className="mt-2 text-xs font-medium text-red-300 underline underline-offset-2 hover:text-red-200"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ========================================
              COMPOSER
          ======================================== */}

          <div className="border-t border-white/10 bg-[#0b1120] p-4 sm:p-5">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-4xl"
            >
              <div
                className={`relative rounded-2xl border bg-white/[0.025] transition ${
                  question.trim()
                    ? "border-violet-400/30 shadow-lg shadow-violet-900/10"
                    : "border-white/10"
                }`}
              >
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value
                    )
                  }
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={3}
                  maxLength={2000}
                  placeholder="Ask about your invoices, payments or business..."
                  className="w-full resize-none bg-transparent px-4 pb-14 pt-4 text-sm leading-6 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <div className="absolute bottom-3 left-4 text-[10px] text-slate-600">
                  {question.length}/2000
                  <span className="ml-2 hidden sm:inline">
                    · Enter to send · Shift+Enter for
                    new line
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !question.trim()
                  }
                  className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-900/20 transition hover:from-violet-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                >
                  {loading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={17} />
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-600">
                <MessageSquare size={12} />
                AI responses are generated from your
                InvoiceAI business data.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  MessageSquare,
  Calendar,
  HelpCircle,
  BarChart3,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Upload,
  Image as ImageIcon,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight,
  Clock,
  BookOpen,
  Brain,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Check,
  AlertTriangle,
  History,
  Trash2,
  Plus,
  Search,
  Filter,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTimerStore } from "@/store/timerStore";
import { gsapFadeIn, gsapStagger, gsapMagnetic, gsapResetMagnetic, gsapAudioWave } from "@/lib/gsap-animations";
import FormattedContent from "@/components/ai/FormattedContent";

type TabType = "coach" | "planner" | "quiz" | "analytics" | "history";
type HistoryFilter = "all" | "chat" | "planner" | "quiz" | "analytics";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  image?: string;
  audio?: boolean;
  timestamp: Date | string;
}

interface AIHistoryItem {
  _id?: string;
  id?: string;
  type: "chat" | "planner" | "quiz" | "analytics";
  title: string;
  summary?: string;
  data: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "model",
  content:
    "👋 Welcome! I'm your **FocusDesk AI Academic Coach & Tutor**.\n\nAsk me to break down difficult concepts (Feynman technique), formulate problem-solving steps, upload textbook photos for step-by-step solutions, or use the mic button to speak out loud with live Speech-to-Text!",
  timestamp: new Date(),
};

export default function AIPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("coach");

  // GSAP tab content transition on tab switch
  const tabContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tabContainerRef.current) {
      gsapFadeIn(tabContainerRef.current, { y: 15, duration: 0.4 });
    }
  }, [activeTab]);

  // -------------------------------------------------------------
  // ALL HISTORY SYSTEM (Chats, Plans, Quizzes, Analytics)
  // -------------------------------------------------------------
  const [historyItems, setHistoryItems] = useState<AIHistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<AIHistoryItem | null>(null);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      if (session?.user) {
        const res = await fetch("/api/ai/history");
        if (res.ok) {
          const data = await res.json();
          setHistoryItems(data.items || []);
          return;
        }
      }
      if (typeof window !== "undefined") {
        const local = JSON.parse(localStorage.getItem("focusdesk_ai_history") || "[]");
        setHistoryItems(local);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [session?.user]);

  const saveToHistory = async (
    type: "chat" | "planner" | "quiz" | "analytics",
    title: string,
    summary: string,
    data: any,
    existingId?: string
  ): Promise<string> => {
    let savedId = existingId || `local_${type}_${Date.now()}`;

    try {
      if (session?.user) {
        const res = await fetch("/api/ai/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: existingId,
            type,
            title,
            summary,
            data,
          }),
        });
        if (res.ok) {
          const resData = await res.json();
          savedId = resData.item._id;
        }
      }

      setHistoryItems((prev) => {
        const index = prev.findIndex((i) => (i._id || i.id) === savedId);
        const newItem: AIHistoryItem = {
          _id: savedId,
          id: savedId,
          type,
          title,
          summary,
          data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        let updated: AIHistoryItem[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = newItem;
        } else {
          updated = [newItem, ...prev];
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("focusdesk_ai_history", JSON.stringify(updated));
        }
        return updated;
      });
    } catch (err) {
      console.error("Failed to save history:", err);
    }

    return savedId;
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      if (session?.user) {
        await fetch(`/api/ai/history?id=${id}`, { method: "DELETE" });
      }
      setHistoryItems((prev) => {
        const updated = prev.filter((i) => (i._id || i.id) !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem("focusdesk_ai_history", JSON.stringify(updated));
        }
        return updated;
      });

      if (activeChatId === id) {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const clearAllHistory = async (type?: HistoryFilter) => {
    if (!confirm(`Are you sure you want to clear ${type === "all" ? "all AI history" : `${type} history`}?`)) {
      return;
    }

    try {
      if (session?.user) {
        await fetch(`/api/ai/history?all=true&type=${type || "all"}`, { method: "DELETE" });
      }
      setHistoryItems((prev) => {
        const updated = type && type !== "all" ? prev.filter((i) => i.type !== type) : [];
        if (typeof window !== "undefined") {
          localStorage.setItem("focusdesk_ai_history", JSON.stringify(updated));
        }
        return updated;
      });

      if (!type || type === "all" || type === "chat") {
        startNewChat();
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // -------------------------------------------------------------
  // TAB 1: COACH STATE & SPEECH-TO-TEXT (VOICE)
  // -------------------------------------------------------------
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const [attachedAudio, setAttachedAudio] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);

  // Live Speech Recognition & Audio Waveform
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoice, setAutoVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [micStatusMsg, setMicStatusMsg] = useState("");

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio wave visualizer bar refs for GSAP animation
  const waveBar1 = useRef<HTMLSpanElement>(null);
  const waveBar2 = useRef<HTMLSpanElement>(null);
  const waveBar3 = useRef<HTMLSpanElement>(null);
  const waveBar4 = useRef<HTMLSpanElement>(null);
  const waveBar5 = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isRecording) return;
    const bars = [waveBar1.current, waveBar2.current, waveBar3.current, waveBar4.current, waveBar5.current].filter(Boolean);
    if (bars.length > 0) {
      gsapAudioWave(bars, true);
    }
    return () => {
      if (bars.length > 0) {
        gsapAudioWave(bars, false);
      }
    };
  }, [isRecording]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimTranscript]);

  // -------------------------------------------------------------
  // UNIVERSAL DUAL-ENGINE MICROPHONE RECORDING HANDLER
  // -------------------------------------------------------------
  const stopAllRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsRecording(false);
    setInterimTranscript("");
    setMicStatusMsg("");
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopAllRecording();
      return;
    }

    setMicStatusMsg("Requesting microphone permission...");

    // 1. Explicitly request microphone stream from user
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      alert(
        "Microphone permission was not granted. Please check your browser's address bar (click the lock or camera/mic icon) and set Microphone to 'Allow'."
      );
      setMicStatusMsg("");
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    setMicStatusMsg("Microphone active — speak clearly...");

    // 2. Try Web Speech API SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    let speechRecognitionStarted = false;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              currentInterim += transcript;
            }
          }

          if (finalTranscript) {
            setCoachInput((prev) => (prev ? `${prev} ${finalTranscript.trim()}` : finalTranscript.trim()));
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition notice:", e.error);
          if (e.error === "not-allowed") {
            alert("Microphone permission was blocked. Please allow mic access in your browser settings.");
            stopAllRecording();
          }
        };

        recognition.onend = () => {
          // If stopped intentionally, do not restart
        };

        recognition.start();
        recognitionRef.current = recognition;
        speechRecognitionStarted = true;
      } catch (recErr) {
        console.warn("SpeechRecognition failed, falling back to MediaRecorder:", recErr);
      }
    }

    // 3. Fallback or parallel MediaRecorder capture (produces voice blob for Gemini audio reasoning)
    try {
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = reader.result as string;
            // If SpeechRecognition did not transcribe any text, attach audio directly
            setAttachedAudio({
              base64: base64Audio,
              mimeType,
            });
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
    } catch (recErr) {
      console.warn("MediaRecorder initialization warning:", recErr);
    }
  };

  // Text to Speech Voice Output
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const clean = text
      // Convert common LaTeX math formulas to natural spoken words
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
      .replace(/\\sqrt\{([^}]+)\}/g, "square root of $1")
      .replace(/\\tan\s*(?:\(?\\?theta\)?|\(([^)]+)\))/g, "tangent of theta")
      .replace(/\\sin\s*(?:\(?\\?theta\)?|\(([^)]+)\))/g, "sine of theta")
      .replace(/\\cos\s*(?:\(?\\?theta\)?|\(([^)]+)\))/g, "cosine of theta")
      .replace(/\\theta/g, "theta")
      .replace(/\\pi/g, "pi")
      .replace(/\\text\{([^}]+)\}/g, "$1")
      .replace(/\\times/g, " times ")
      .replace(/\\approx/g, " approximately ")
      .replace(/[*#_`>$]/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .slice(0, 600);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachedImage({
        base64: result,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.readAsDataURL(file);
  };

  // Start fresh chat session
  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setCoachInput("");
    setAttachedImage(null);
    setAttachedAudio(null);
    setShowChatDrawer(false);
  };

  // Load chat session from history
  const loadChatFromHistory = (item: AIHistoryItem) => {
    if (item.type !== "chat" || !item.data?.messages) return;
    setActiveChatId(item._id || item.id || null);
    setMessages(item.data.messages);
    setShowChatDrawer(false);
    setActiveTab("coach");
  };

  const handleSendCoach = async (textToSend?: string) => {
    const query = (textToSend || coachInput).trim();
    if (!query && !attachedImage && !attachedAudio) return;

    // Stop active recording if running
    if (isRecording) {
      stopAllRecording();
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query || (attachedAudio ? "🎙️ [Spoken Voice Question]" : "Please explain this image step-by-step."),
      image: attachedImage?.base64,
      audio: !!attachedAudio,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCoachInput("");
    const imgToSend = attachedImage;
    const audioToSend = attachedAudio;
    setAttachedImage(null);
    setAttachedAudio(null);
    setCoachLoading(true);

    try {
      const apiMessages = newMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          image: imgToSend,
          audio: audioToSend,
          userContext: {
            userName: session?.user?.name || "Student",
          },
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.reply || "I am ready to help you learn! What topic shall we tackle next?",
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);

      // Auto-save this conversation to history
      const title = userMsg.content.slice(0, 50) || "Study Session Discussion";
      const summary = `${finalMessages.length - 1} messages exchanged`;
      const savedId = await saveToHistory("chat", title, summary, { messages: finalMessages }, activeChatId || undefined);
      if (!activeChatId) {
        setActiveChatId(savedId);
      }

      if (autoVoice && data.reply) {
        speakText(data.reply);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: "⚠️ Unable to reach the AI engine. Please verify your network or GEMINI_API_KEY.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setCoachLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 2: EXAM & STUDY PLANNER STATE & HANDLERS
  // -------------------------------------------------------------
  const [plannerExamTitle, setPlannerExamTitle] = useState("Final Exam Prep");
  const [plannerExamDate, setPlannerExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [plannerTopics, setPlannerTopics] = useState(
    "Chapter 1: Foundations\nChapter 2: Methods & Proofs\nChapter 3: Advanced Problems\nChapter 4: Comprehensive Mock Review"
  );
  const [plannerDailyHours, setPlannerDailyHours] = useState(3);
  const [plannerTimePref, setPlannerTimePref] = useState("evening");
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [planSynced, setPlanSynced] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  const handleGeneratePlan = async () => {
    setPlannerLoading(true);
    setPlanSynced(false);
    try {
      const res = await fetch("/api/ai/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examTitle: plannerExamTitle,
          examDate: plannerExamDate,
          topics: plannerTopics,
          dailyHours: Number(plannerDailyHours),
          preferredTime: plannerTimePref,
          saveToPlanner: false,
        }),
      });
      const data = await res.json();
      if (data.plan) {
        setGeneratedPlan(data.plan);

        await saveToHistory(
          "planner",
          data.plan.examTitle || plannerExamTitle,
          `${data.plan.totalStudyHours} hrs • ${data.plan.studyBlocks?.length || 0} study blocks planned`,
          data.plan
        );
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate plan. Please try again.");
    } finally {
      setPlannerLoading(false);
    }
  };

  const handleSyncToPlanner = async (planToSync = generatedPlan) => {
    if (!planToSync) return;
    setSyncLoading(true);

    try {
      if (session?.user) {
        const res = await fetch("/api/ai/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            examTitle: planToSync.examTitle || plannerExamTitle,
            examDate: plannerExamDate,
            topics: plannerTopics,
            dailyHours: Number(plannerDailyHours),
            preferredTime: plannerTimePref,
            saveToPlanner: true,
          }),
        });
        const data = await res.json();
        if (data.savedToDb) {
          setPlanSynced(true);
        }
      } else {
        const existing = JSON.parse(localStorage.getItem("focusdesk-guest-planner") || "[]");
        const newItems = (planToSync.studyBlocks || []).map((b: any, idx: number) => ({
          _id: `guest_ai_${Date.now()}_${idx}`,
          title: b.title,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          priority: b.priority || "medium",
          status: "pending",
          notes: b.notes || "",
        }));
        localStorage.setItem(
          "focusdesk-guest-planner",
          JSON.stringify([...existing, ...newItems])
        );
        setPlanSynced(true);
      }
    } catch (err) {
      console.error("Sync error:", err);
      alert("Error syncing to study planner.");
    } finally {
      setSyncLoading(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: QUIZ GENERATOR STATE & HANDLERS
  // -------------------------------------------------------------
  const [quizTopic, setQuizTopic] = useState("Cellular Respiration & Krebs Cycle");
  const [quizDifficulty, setQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [quizLoading, setQuizLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: quizTopic,
          difficulty: quizDifficulty,
          questionCount: 5,
        }),
      });
      const data = await res.json();
      if (data.quiz) {
        setActiveQuiz(data.quiz);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectQuizAnswer = (qIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let score = 0;
    activeQuiz.questions.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.correctAnswerIndex) {
        score++;
      }
    });
    return score;
  };

  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true);
    const score = calculateScore();
    const total = activeQuiz.questions.length;
    const percentage = Math.round((score / total) * 100);

    await saveToHistory(
      "quiz",
      activeQuiz.title || `${activeQuiz.topic} Quiz`,
      `Score: ${score}/${total} (${percentage}%) • ${activeQuiz.difficulty.toUpperCase()}`,
      {
        quiz: activeQuiz,
        answers: quizAnswers,
        score,
        total,
      }
    );
  };

  // -------------------------------------------------------------
  // TAB 4: ANALYTICS COACH STATE & HANDLERS
  // -------------------------------------------------------------
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const handleFetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      let clientMetrics = null;
      if (!session?.user && typeof window !== "undefined") {
        const guestSessions = JSON.parse(localStorage.getItem("focusdesk-guest-sessions") || "[]");
        const totalSec = guestSessions.reduce(
          (acc: number, s: any) => acc + (s.durationSeconds || 0),
          0
        );
        clientMetrics = {
          totalSeconds: totalSec,
          sessionCount: guestSessions.length,
          currentStreak: guestSessions.length > 0 ? 1 : 0,
          bestStreak: guestSessions.length > 0 ? 1 : 0,
        };
      }

      const res = await fetch("/api/ai/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientMetrics,
        }),
      });
      const data = await res.json();
      setAnalyticsData(data);

      if (data.insights) {
        await saveToHistory(
          "analytics",
          data.insights.scholarPersona || "Academic Performance Evaluation",
          `Evaluated ${data.metrics?.totalHours || 0} hrs • ${data.metrics?.currentStreak || 0}-day streak`,
          data
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics" && !analyticsData && !analyticsLoading) {
      handleFetchAnalytics();
    }
  }, [activeTab]);

  const filteredHistory = historyItems.filter((item) => {
    if (historyFilter !== "all" && item.type !== historyFilter) return false;
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchSummary = item.summary?.toLowerCase().includes(q);
      return matchTitle || matchSummary;
    }
    return true;
  });

  const chatSessions = historyItems.filter((i) => i.type === "chat");

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 shadow-sm shadow-violet-500/10">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              AI Academic Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Multimodal Study Coach, Real-time Voice Speech-to-Text, Exam Planner, Quizzes & Full History.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("history")}
            onMouseMove={(e) => gsapMagnetic(e, 0.2)}
            onMouseLeave={gsapResetMagnetic}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              activeTab === "history"
                ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-600/20"
                : "border-neutral-800 bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800"
            }`}
            title="View All History (Chats, Plans, Quizzes, Analytics)"
          >
            <History className="w-3.5 h-3.5 text-violet-400" />
            <span>History ({historyItems.length})</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation (Fluid Scrollable on Mobile/Tablet) */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-neutral-950 border border-neutral-800 overflow-x-auto scrollbar-none shadow-inner">
        <button
          onClick={() => setActiveTab("coach")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "coach"
              ? "bg-white text-black shadow-md font-semibold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Study Coach <span className="hidden sm:inline">& Voice</span></span>
        </button>

        <button
          onClick={() => setActiveTab("planner")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "planner"
              ? "bg-white text-black shadow-md font-semibold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Exam Planner <span className="hidden md:inline">& Schedule</span></span>
        </button>

        <button
          onClick={() => setActiveTab("quiz")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "quiz"
              ? "bg-white text-black shadow-md font-semibold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">Quiz Generator</span>
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 ${
            activeTab === "analytics"
              ? "bg-white text-black shadow-md font-semibold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">AI Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shrink-0 sm:ml-auto ${
            activeTab === "history"
              ? "bg-white text-black shadow-md font-semibold"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <History className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">All History</span>
        </button>
      </div>

      {/* Main Tab Animated Container */}
      <div ref={tabContainerRef}>
        {/* ------------------------------------------------------------- */}
        {/* TAB 1: STUDY COACH & VOICE & IMAGE EXPLANATION */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "coach" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Main Chat Box */}
            <div className="lg:col-span-3 flex flex-col h-[540px] sm:h-[620px] lg:h-[680px] bg-neutral-950 rounded-2xl border border-neutral-800 shadow-xl overflow-hidden relative">
              {/* Coach Toolbar */}
              <div className="h-14 px-3 sm:px-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/40">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowChatDrawer(!showChatDrawer)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-xs text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
                    title="View Saved Chat Conversations"
                  >
                    <History className="w-3.5 h-3.5 text-violet-400" />
                    <span>Chats ({chatSessions.length})</span>
                  </button>

                  <button
                    onClick={startNewChat}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all"
                    title="Start a new clean chat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">New Chat</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setAutoVoice(!autoVoice)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                      autoVoice
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                        : "border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                    title="Toggle Auto-Voice reading of answers"
                  >
                    {autoVoice ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span className="hidden xs:inline">Auto-Voice</span>
                  </button>
                </div>
              </div>

              {/* Chat Sessions Slide Drawer */}
              {showChatDrawer && (
                <div className="absolute top-14 left-0 bottom-0 w-72 max-w-[85vw] bg-neutral-950/95 backdrop-blur-md border-r border-neutral-800 z-30 p-3 space-y-3 flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                      Previous Chats
                    </h4>
                    <button
                      onClick={() => setShowChatDrawer(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                    {chatSessions.length === 0 ? (
                      <div className="text-center py-8 text-neutral-500 text-xs">
                        No saved chats yet. Start chatting below to automatically save conversations!
                      </div>
                    ) : (
                      chatSessions.map((sessionItem) => {
                        const isCurrent = (sessionItem._id || sessionItem.id) === activeChatId;
                        return (
                          <div
                            key={sessionItem._id || sessionItem.id}
                            className={`group flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-neutral-800 border-neutral-600 text-white font-medium"
                                : "bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800/80 hover:text-white"
                            }`}
                            onClick={() => loadChatFromHistory(sessionItem)}
                          >
                            <div className="truncate flex-1 pr-2">
                              <p className="truncate font-medium">{sessionItem.title}</p>
                              <p className="text-[10px] text-neutral-500 truncate">{sessionItem.summary}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(sessionItem._id || sessionItem.id!);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
                              title="Delete this chat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {chatSessions.length > 0 && (
                    <button
                      onClick={() => clearAllHistory("chat")}
                      className="w-full text-center py-2 text-[11px] text-rose-400 hover:underline border-t border-neutral-800"
                    >
                      Clear Chat History
                    </button>
                  )}
                </div>
              )}

              {/* Chat Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((m) => {
                  const isBot = m.role === "model";
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
                    >
                      {isBot && (
                        <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0 mt-0.5 shadow-sm">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm leading-relaxed space-y-2.5 ${
                          isBot
                            ? "bg-neutral-900/90 text-neutral-200 border border-neutral-800 shadow-sm"
                            : "bg-neutral-800/90 border border-neutral-700/80 text-white font-normal ml-auto shadow-sm"
                        }`}
                      >
                        {m.image && (
                          <div className="rounded-xl overflow-hidden border border-neutral-800 mb-2 w-full max-w-xs sm:max-w-sm">
                            <img
                              src={m.image}
                              alt="Uploaded question"
                              className="w-full h-auto object-cover max-h-56 sm:max-h-64"
                            />
                          </div>
                        )}

                        <FormattedContent
                          content={m.content}
                          className={isBot ? "text-neutral-200" : "text-white font-normal"}
                        />

                        {isBot && (
                          <div className="pt-2 flex items-center gap-2 border-t border-neutral-800/80">
                            <button
                              onClick={() => speakText(m.content)}
                              className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Read Out Loud</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {coachLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 text-sm bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-400" />
                      <span>Formulating solution...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Live Audio Waveform & Speech-to-Text Indicator */}
              {isRecording && (
                <div className="px-4 py-2.5 bg-gradient-to-r from-red-950/80 via-neutral-900 to-neutral-900 border-t border-red-500/40 flex items-center justify-between text-xs text-red-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-3">
                    {/* Animated GSAP Soundwave Bars */}
                    <div className="flex items-center gap-1 h-5 shrink-0">
                      <span ref={waveBar1} className="w-1 bg-red-400 rounded-full h-4 origin-bottom"></span>
                      <span ref={waveBar2} className="w-1 bg-red-400 rounded-full h-5 origin-bottom"></span>
                      <span ref={waveBar3} className="w-1 bg-red-400 rounded-full h-3 origin-bottom"></span>
                      <span ref={waveBar4} className="w-1 bg-red-400 rounded-full h-5 origin-bottom"></span>
                      <span ref={waveBar5} className="w-1 bg-red-400 rounded-full h-4 origin-bottom"></span>
                    </div>

                    <div className="truncate flex-1">
                      <span className="font-semibold text-white">Listening: </span>
                      <span className="text-red-200 italic">
                        {interimTranscript || "Speak your question into the microphone..."}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={stopAllRecording}
                    className="text-[11px] font-semibold bg-red-500/20 text-red-200 px-3 py-1 rounded-xl border border-red-500/50 hover:bg-red-500/40 transition-colors shrink-0"
                  >
                    Done Speaking
                  </button>
                </div>
              )}

              {/* Status Notice if requesting mic */}
              {micStatusMsg && !isRecording && (
                <div className="px-4 py-1.5 bg-neutral-900 border-t border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                  <span>{micStatusMsg}</span>
                </div>
              )}

              {/* Audio Recording Attachment Preview */}
              {attachedAudio && !isRecording && (
                <div className="px-4 py-2 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between text-xs text-violet-300">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-violet-400" />
                    <span>Voice snippet recorded & attached for AI reasoning</span>
                  </div>
                  <button
                    onClick={() => setAttachedAudio(null)}
                    className="text-neutral-400 hover:text-white"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Image Preview Thumbnail if attached */}
              {attachedImage && (
                <div className="px-4 py-2 bg-neutral-900/60 border-t border-neutral-800 flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-700 shrink-0">
                    <img
                      src={attachedImage.base64}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => setAttachedImage(null)}
                      className="absolute -top-1 -right-1 bg-black/80 rounded-full p-0.5 text-neutral-400 hover:text-white"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">Image attached for visual reasoning</p>
                    <p className="text-[11px] text-neutral-400">
                      Ask: "Explain this diagram" or "Solve step-by-step"
                    </p>
                  </div>
                </div>
              )}

              {/* Input Form with Real-time Voice & Image Upload */}
              <div className="p-2.5 sm:p-3 bg-neutral-950 border-t border-neutral-800">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCoach();
                  }}
                  className="flex items-center gap-1.5 sm:gap-2"
                >
                  {/* Image Upload Button */}
                  <label className="p-2 sm:p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700 cursor-pointer transition-all shrink-0">
                    <ImageIcon className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Real-time Microphone Dictation Button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all shrink-0 ${
                      isRecording
                        ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 scale-105"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-700"
                    }`}
                    title={isRecording ? "Click to stop recording" : "Click to speak via microphone"}
                  >
                    {isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Text Input - Dark themed & responsive */}
                  <input
                    type="text"
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    placeholder={
                      isRecording
                        ? "Transcribing your voice in real-time..."
                        : "Ask anything, explain concepts, paste textbook problems..."
                    }
                    className="flex-1 min-w-0 bg-neutral-900 border border-neutral-800 focus:border-neutral-700 focus:bg-neutral-900/90 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
                    disabled={coachLoading}
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={coachLoading || (!coachInput.trim() && !attachedImage && !attachedAudio)}
                    className="p-2 sm:p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold shadow-md shadow-violet-600/20 shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Prompts & Study Principles */}
            <div className="space-y-4">
              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3 shadow-lg">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Quick Prompts</span>
                </h3>
                <div className="space-y-2">
                  {[
                    "Explain the Feynman technique with an example",
                    "How to pace a 50/10 Pomodoro deep session?",
                    "Give me 3 active recall questions on Newton's Laws",
                    "Create a revision plan for Organic Chemistry",
                    "How do I beat study fatigue after 4 hours?",
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendCoach(prompt)}
                      className="w-full text-left p-2.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800/80 text-xs text-neutral-300 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3 text-xs text-neutral-400 leading-relaxed shadow-lg">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" />
                  <span>Coach Capabilities</span>
                </h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong className="text-neutral-300">Dual-Engine Voice</strong>: Real-time STT + voice audio recording with animated frequency waves.
                  </li>
                  <li>
                    <strong className="text-neutral-300">Image Recognition</strong>: Snap photos of equations, formulas, diagrams, or pages.
                  </li>
                  <li>
                    <strong className="text-neutral-300">Persistent Chat History</strong>: All conversations auto-saved and resumable anytime.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: EXAM & SCHEDULE PLANNER */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "planner" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-5 h-fit shadow-xl">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-400" />
                  <span>Exam Timetable Generator</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Enter your exam details to generate a phased study plan with 1-click sync.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Exam Title / Target Subject
                  </label>
                  <input
                    type="text"
                    value={plannerExamTitle}
                    onChange={(e) => setPlannerExamTitle(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all"
                    placeholder="e.g. Calculus II Final or MCAT Physics"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Target Exam Date
                  </label>
                  <input
                    type="date"
                    value={plannerExamDate}
                    onChange={(e) => setPlannerExamDate(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Syllabus / Modules to Cover
                  </label>
                  <textarea
                    rows={4}
                    value={plannerTopics}
                    onChange={(e) => setPlannerTopics(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl p-3 text-xs text-white focus:outline-none transition-all resize-none font-mono"
                    placeholder="Paste chapters, lecture titles, or syllabus outline..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Target Daily Hours
                    </label>
                    <select
                      value={plannerDailyHours}
                      onChange={(e) => setPlannerDailyHours(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none transition-all [color-scheme:dark]"
                    >
                      <option value={1}>1 hour/day</option>
                      <option value={2}>2 hours/day</option>
                      <option value={3}>3 hours/day</option>
                      <option value={4}>4 hours/day</option>
                      <option value={6}>6 hours/day (Intense)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Preferred Time
                    </label>
                    <select
                      value={plannerTimePref}
                      onChange={(e) => setPlannerTimePref(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none transition-all [color-scheme:dark]"
                    >
                      <option value="morning">Morning (08:00)</option>
                      <option value="afternoon">Afternoon (14:00)</option>
                      <option value="evening">Evening (18:00)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePlan}
                  disabled={plannerLoading}
                  onMouseMove={(e) => gsapMagnetic(e, 0.2)}
                  onMouseLeave={gsapResetMagnetic}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all disabled:opacity-50 shadow"
                >
                  {plannerLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Calculating Optimal Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {!generatedPlan ? (
                <div className="h-[480px] rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                  <Calendar className="w-12 h-12 mb-3 text-neutral-600" />
                  <h3 className="text-base font-medium text-neutral-300">No Plan Generated Yet</h3>
                  <p className="text-xs max-w-sm mt-1">
                    Fill in your exam date and syllabus on the left and click "Generate AI Schedule"
                    to calculate spaced repetition blocks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {generatedPlan.examTitle}
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {generatedPlan.strategySummary}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSyncToPlanner(generatedPlan)}
                        disabled={syncLoading || planSynced}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                          planSynced
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white text-black hover:bg-neutral-200 shadow"
                        }`}
                      >
                        {syncLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : planSynced ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <PlusCircle className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {planSynced
                            ? "Synced to Planner!"
                            : "1-Click Sync to Study Planner"}
                        </span>
                      </button>
                    </div>

                    {planSynced && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                        <span>
                          All {generatedPlan.studyBlocks?.length || 0} study blocks have been added to your
                          Study Planner!
                        </span>
                        <Link
                          href="/planner"
                          className="underline font-semibold hover:text-white flex items-center gap-1"
                        >
                          Open Planner <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-neutral-400 pt-1 border-t border-neutral-900">
                      <span>
                        Total Hours:{" "}
                        <strong className="text-white">
                          {generatedPlan.totalStudyHours} hrs
                        </strong>
                      </span>
                      <span>
                        Study Blocks:{" "}
                        <strong className="text-white">
                          {generatedPlan.studyBlocks?.length || 0} days
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {(generatedPlan.studyBlocks || []).map((block: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                block.priority === "high"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-neutral-800 text-neutral-300"
                              }`}
                            >
                              {block.priority || "Normal"}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {block.title}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-snug">
                            {block.notes}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-neutral-400 shrink-0">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            <span>{block.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-neutral-500" />
                            <span>
                              {block.startTime} - {block.endTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: INTERACTIVE QUIZ GENERATOR */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "quiz" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-5 h-fit shadow-xl">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-violet-400" />
                  <span>Instant Quiz Generator</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Active recall testing creates stronger neural pathways than passive re-reading.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Quiz Topic / Subject or Notes
                  </label>
                  <textarea
                    rows={3}
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none transition-all resize-none"
                    placeholder="e.g. Mitosis vs Meiosis, Calculus Derivatives, or paste your summary notes..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Difficulty Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setQuizDifficulty(lvl)}
                        className={`py-2 text-xs font-medium rounded-xl border capitalize transition-all ${
                          quizDifficulty === lvl
                            ? "bg-white text-black border-white font-semibold shadow"
                            : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                  onMouseMove={(e) => gsapMagnetic(e, 0.2)}
                  onMouseLeave={gsapResetMagnetic}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-all disabled:opacity-50 shadow"
                >
                  {quizLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Formulating Questions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate 5 Questions</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              {!activeQuiz ? (
                <div className="h-[480px] rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                  <HelpCircle className="w-12 h-12 mb-3 text-neutral-600" />
                  <h3 className="text-base font-medium text-neutral-300">Quiz Player Ready</h3>
                  <p className="text-xs max-w-sm mt-1">
                    Type any subject or lecture summary and click "Generate 5 Questions" to test your
                    retention!
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border border-neutral-800 space-y-4 sm:space-y-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
                    <div>
                      <h3 className="text-base font-semibold text-white">{activeQuiz.title}</h3>
                      <span className="text-xs text-neutral-400">
                        Topic: {activeQuiz.topic} • {activeQuiz.difficulty.toUpperCase()}
                      </span>
                    </div>

                    {quizSubmitted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800">
                          Score: {calculateScore()} / {activeQuiz.questions.length}
                        </span>
                        <button
                          onClick={() => {
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                          }}
                          className="p-2 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-400 hover:text-white"
                          title="Retry Quiz"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={
                          Object.keys(quizAnswers).length < activeQuiz.questions.length
                        }
                        className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all disabled:opacity-40 shadow"
                      >
                        Submit & Save Score
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {activeQuiz.questions.map((q: any, qIdx: number) => {
                      const selectedOpt = quizAnswers[qIdx];
                      const isCorrect = selectedOpt === q.correctAnswerIndex;

                      return (
                        <div
                          key={q.id || qIdx}
                          className="space-y-3 p-4 rounded-xl bg-neutral-900/40 border border-neutral-800/80 shadow-sm"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <div className="text-sm font-medium text-white flex-1">
                              <FormattedContent content={q.question} />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt: string, optIdx: number) => {
                              const isThisSelected = selectedOpt === optIdx;
                              const isThisCorrect = q.correctAnswerIndex === optIdx;

                              let btnStyle =
                                "bg-black border-neutral-800 text-neutral-300 hover:border-neutral-700";

                              if (quizSubmitted) {
                                if (isThisCorrect) {
                                  btnStyle =
                                    "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-semibold";
                                } else if (isThisSelected && !isCorrect) {
                                  btnStyle =
                                    "bg-rose-500/10 border-rose-500/50 text-rose-300";
                                }
                              } else if (isThisSelected) {
                                btnStyle =
                                  "bg-white text-black font-semibold border-white shadow";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => handleSelectQuizAnswer(qIdx, optIdx)}
                                  className={`text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                >
                                  <div className="flex-1">
                                    <FormattedContent content={opt} />
                                  </div>
                                  {quizSubmitted && isThisCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                                  )}
                                  {quizSubmitted && isThisSelected && !isCorrect && (
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1.5">
                              <div className="text-neutral-300">
                                <strong className="text-white block mb-0.5">Explanation: </strong>
                                <FormattedContent content={q.explanation} />
                              </div>
                              {q.studyTip && (
                                <div className="text-violet-400 flex items-start gap-1.5 pt-1">
                                  <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <FormattedContent content={q.studyTip} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: AI PERFORMANCE ANALYTICS COACH */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-xl">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  <span>Cognitive Habits & Performance Evaluation</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  AI evaluates your focus sessions, consistency streaks, and subject balance to build
                  your ideal study rhythm.
                </p>
              </div>

              <button
                onClick={handleFetchAnalytics}
                disabled={analyticsLoading}
                onMouseMove={(e) => gsapMagnetic(e, 0.2)}
                onMouseLeave={gsapResetMagnetic}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shrink-0 disabled:opacity-50 shadow-md shadow-violet-600/20"
              >
                {analyticsLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Evaluating Habits...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refresh Analysis</span>
                  </>
                )}
              </button>
            </div>

            {analyticsLoading && !analyticsData ? (
              <div className="h-64 rounded-2xl border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
                <p className="text-sm text-neutral-300">Analyzing your study logs and session patterns...</p>
              </div>
            ) : analyticsData?.insights ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-violet-950/40 via-neutral-950 to-neutral-950 border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-violet-400 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                      Learning Persona
                    </span>
                    <h3 className="text-2xl font-bold text-white">
                      {analyticsData.insights.scholarPersona}
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-xl">
                      Based on your logged {analyticsData.metrics?.totalHours || 0} total focus hours
                      and active streaks.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-center">
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 shadow">
                      <span className="block text-xl font-bold text-white">
                        {analyticsData.metrics?.totalHours || 0}h
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase">Focus Time</span>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 shadow">
                      <span className="block text-xl font-bold text-emerald-400">
                        {analyticsData.metrics?.currentStreak || 0}d
                      </span>
                      <span className="text-[10px] text-neutral-400 uppercase">Streak</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 shadow-lg">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Observed Strengths</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {(analyticsData.insights.strengths || []).map((s: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-xs text-neutral-300 flex items-start gap-2 bg-neutral-900/50 p-2.5 rounded-xl border border-neutral-800/60"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 shadow-lg">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Optimization Opportunities</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {(analyticsData.insights.improvements || []).map((imp: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-xs text-neutral-300 flex items-start gap-2 bg-neutral-900/50 p-2.5 rounded-xl border border-neutral-800/60"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4 shadow-xl">
                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-violet-400" />
                      <span>Recommended Weekly Rhythm</span>
                    </h4>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
                      {analyticsData.insights.recommendedSchedule}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Brain className="w-4 h-4 text-violet-400" />
                      <span>Weekly Masterclass Advice</span>
                    </h4>
                    <p className="text-xs text-neutral-300 mt-2 leading-relaxed bg-neutral-900/60 p-3.5 rounded-xl border border-neutral-800">
                      {analyticsData.insights.weeklyAdvice}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-neutral-800 bg-neutral-950 text-center text-neutral-400 text-xs">
                Click "Refresh Analysis" above to generate your study habits report.
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: ALL AI HISTORY (CHATS, PLANS, QUIZZES, ANALYTICS) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-xl">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-violet-400" />
                  <span>AI Activity & Study History</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Review past coaching chats, saved exam schedules, completed quizzes, and habit evaluations.
                </p>
              </div>

              {historyItems.length > 0 && (
                <button
                  onClick={() => clearAllHistory(historyFilter)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear {historyFilter === "all" ? "All" : historyFilter} History</span>
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
                {[
                  { id: "all", label: "All Items" },
                  { id: "chat", label: "💬 Coach Chats" },
                  { id: "planner", label: "📅 Exam Plans" },
                  { id: "quiz", label: "📝 Quizzes" },
                  { id: "analytics", label: "📊 Analytics" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id as HistoryFilter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all shrink-0 ${
                      historyFilter === f.id
                        ? "bg-white text-black border-white font-semibold shadow"
                        : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search history..."
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-neutral-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {historyLoading ? (
              <div className="h-64 rounded-2xl border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center text-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400 mb-2" />
                <p className="text-xs text-neutral-400">Loading history records...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="h-64 rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 flex flex-col items-center justify-center text-center p-8 text-neutral-500">
                <History className="w-10 h-10 mb-2 text-neutral-600" />
                <p className="text-sm font-medium text-neutral-300">No History Found</p>
                <p className="text-xs max-w-sm mt-1">
                  {historySearch
                    ? "No records matched your search query."
                    : "Start a conversation, generate a study schedule, or complete a quiz to see your history logged here."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHistory.map((item) => {
                  const itemId = item._id || item.id || Math.random().toString();
                  const typeColors = {
                    chat: "bg-violet-500/10 text-violet-400 border-violet-500/20",
                    planner: "bg-blue-500/10 text-blue-400 border-blue-500/20",
                    quiz: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                    analytics: "bg-amber-500/10 text-amber-400 border-amber-500/20",
                  };

                  const typeIcons = {
                    chat: MessageSquare,
                    planner: Calendar,
                    quiz: HelpCircle,
                    analytics: BarChart3,
                  };
                  const Icon = typeIcons[item.type] || Sparkles;

                  return (
                    <div
                      key={itemId}
                      className="p-5 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3 group shadow-md"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                              typeColors[item.type]
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{item.type}</span>
                          </span>

                          <button
                            onClick={() => deleteHistoryItem(itemId)}
                            className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition-opacity"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="text-sm font-semibold text-white leading-tight">
                          {item.title}
                        </h4>
                        <p className="text-xs text-neutral-400 leading-snug line-clamp-2">
                          {item.summary || "No additional summary details."}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-neutral-500">
                          {item.updatedAt
                            ? new Date(item.updatedAt).toLocaleDateString()
                            : "Saved recently"}
                        </span>

                        {item.type === "chat" && (
                          <button
                            onClick={() => loadChatFromHistory(item)}
                            className="text-violet-400 hover:text-white font-medium flex items-center gap-1 hover:underline text-xs"
                          >
                            <span>Resume Chat</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {item.type === "planner" && (
                          <button
                            onClick={() => {
                              setGeneratedPlan(item.data);
                              setActiveTab("planner");
                            }}
                            className="text-blue-400 hover:text-white font-medium flex items-center gap-1 hover:underline text-xs"
                          >
                            <span>View & Sync Plan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {item.type === "quiz" && (
                          <button
                            onClick={() => setSelectedReviewItem(item)}
                            className="text-emerald-400 hover:text-white font-medium flex items-center gap-1 hover:underline text-xs"
                          >
                            <span>Review Answers</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {item.type === "analytics" && (
                          <button
                            onClick={() => {
                              setAnalyticsData(item.data);
                              setActiveTab("analytics");
                            }}
                            className="text-amber-400 hover:text-white font-medium flex items-center gap-1 hover:underline text-xs"
                          >
                            <span>View Evaluation</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUIZ REVIEW MODAL FROM HISTORY */}
      {selectedReviewItem && selectedReviewItem.type === "quiz" && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {selectedReviewItem.title}
                </h3>
                <span className="text-xs text-neutral-400">
                  {selectedReviewItem.summary}
                </span>
              </div>
              <button
                onClick={() => setSelectedReviewItem(null)}
                className="text-neutral-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {(selectedReviewItem.data?.quiz?.questions || []).map((q: any, idx: number) => {
                const userAns = selectedReviewItem.data?.answers?.[idx];
                const isCorrect = userAns === q.correctAnswerIndex;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2.5 text-xs"
                  >
                    <div className="font-medium text-white flex items-start gap-1">
                      <span>{idx + 1}.</span>
                      <div className="flex-1">
                        <FormattedContent content={q.question} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isCorrectOpt = q.correctAnswerIndex === optIdx;
                        const isChosenOpt = userAns === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                              isCorrectOpt
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold"
                                : isChosenOpt && !isCorrectOpt
                                ? "bg-rose-500/15 border-rose-500/40 text-rose-300"
                                : "border-neutral-800/80 text-neutral-400 bg-black/40"
                            }`}
                          >
                            <div className="flex-1">
                              <FormattedContent content={opt} />
                            </div>
                            {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-2 shrink-0" />}
                            {isChosenOpt && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 text-rose-400 ml-2 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && (
                      <div className="text-neutral-400 pt-1">
                        <strong className="text-neutral-200 block mb-0.5">Explanation: </strong>
                        <FormattedContent content={q.explanation} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-800 flex justify-end">
              <button
                onClick={() => setSelectedReviewItem(null)}
                className="px-4 py-2 rounded-xl text-xs bg-white text-black font-semibold hover:bg-neutral-200 shadow"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

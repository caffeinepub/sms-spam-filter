import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BarChart2,
  Brain,
  CheckCircle,
  ChevronRight,
  Filter,
  Shield,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  Label,
  useAddRecord,
  useGetAllRecords,
  useSeedDemoData,
} from "./hooks/useQueries";
import type { ClassificationRecord } from "./hooks/useQueries";
import { classify } from "./utils/classifier";
import type { ClassificationResult } from "./utils/classifier";

const SPAM_SAMPLE =
  "WINNER!! As a valued network customer you have been selected to receive a \u00a3900 prize reward! To claim call 09061701461.";
const HAM_SAMPLE =
  "Hey, are you coming to the meeting tomorrow? Let me know if you need help with anything.";

const BAR_COLORS = ["#b63a3a", "#1b7f84"];

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeStats(records: ClassificationRecord[]) {
  const total = records.length;
  const spam = records.filter(
    (r) => r.classificationLabel === Label.spam,
  ).length;
  const ham = total - spam;
  const accuracy =
    total > 0
      ? Math.round(
          (records.reduce((s, r) => s + r.confidence, 0) / total) * 100,
        )
      : 0;
  const spamConf =
    spam > 0
      ? records
          .filter((r) => r.classificationLabel === Label.spam)
          .reduce((s, r) => s + r.confidence, 0) / spam
      : 0;
  const f1 =
    spam > 0
      ? Math.round(
          ((2 * spamConf * (spam / total)) / (spamConf + spam / total)) * 100,
        )
      : 0;
  return { total, spam, ham, accuracy, f1 };
}

interface WordSegment {
  word: string;
  pos: number;
  type: "spam" | "ham" | "neutral";
}

function buildSegments(
  message: string,
  result: ClassificationResult,
): WordSegment[] {
  const tokenMap = new Map(result.tokens.map((t) => [t.token, t.type]));
  const parts = message.split(/(\s+)/);
  let offset = 0;
  return parts.map((word) => {
    const pos = offset;
    offset += word.length;
    const clean = word.toLowerCase().replace(/[^a-z0-9\u00a3$]/g, "");
    const type = tokenMap.get(clean) ?? "neutral";
    return { word, pos, type };
  });
}

function TokenHighlight({
  message,
  result,
}: { message: string; result: ClassificationResult }) {
  const segments = buildSegments(message, result);
  return (
    <span>
      {segments.map((seg) => {
        if (seg.type === "spam") {
          return (
            <mark
              key={seg.pos}
              className="bg-red-100 text-red-700 rounded px-0.5 font-semibold not-italic"
            >
              {seg.word}
            </mark>
          );
        }
        if (seg.type === "ham") {
          return (
            <mark
              key={seg.pos}
              className="bg-teal-bg text-teal-dark rounded px-0.5 font-semibold not-italic"
            >
              {seg.word}
            </mark>
          );
        }
        return <span key={seg.pos}>{seg.word}</span>;
      })}
    </span>
  );
}

export default function App() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  const dashRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);

  const { data: records = [] } = useGetAllRecords();
  const addRecord = useAddRecord();
  const seedDemoData = useSeedDemoData();

  const stats = computeStats(records);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only seed once when records is empty
  useEffect(() => {
    if (records.length === 0) {
      seedDemoData.mutate();
    }
  }, [records.length]);

  const handleClassify = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message to classify.");
      return;
    }
    setIsClassifying(true);
    await new Promise((r) => setTimeout(r, 400));
    const res = classify(message);
    setResult(res);
    setIsClassifying(false);
    addRecord.mutate({
      message,
      label: res.label === "spam" ? Label.spam : Label.ham,
      confidence: res.confidence,
    });
    toast.success(
      `Classified as ${res.label.toUpperCase()} with ${Math.round(res.confidence * 100)}% confidence`,
    );
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const chartData = [
    { name: "Spam", count: stats.spam },
    { name: "Ham", count: stats.ham },
  ];

  const recentRecords = [...records]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, 10);

  const navItems: Array<{
    label: string;
    ref: React.RefObject<HTMLDivElement | null> | null;
  }> = [
    { label: "Home", ref: null },
    { label: "How It Works", ref: pipelineRef },
    { label: "Demo", ref: demoRef },
    { label: "Dashboard", ref: dashRef },
  ];

  const statCards = [
    {
      label: "Total Classified",
      value: stats.total,
      icon: BarChart2,
      color: "text-foreground",
      ocid: "dashboard.stat.item.1",
    },
    {
      label: "Spam",
      value: stats.spam,
      icon: AlertTriangle,
      color: "text-spam",
      ocid: "dashboard.stat.item.2",
    },
    {
      label: "Ham",
      value: stats.ham,
      icon: CheckCircle,
      color: "text-teal",
      ocid: "dashboard.stat.item.3",
    },
    {
      label: "Avg Accuracy",
      value: `${stats.accuracy}%`,
      icon: Zap,
      color: "text-teal",
      ocid: "dashboard.stat.item.4",
    },
    {
      label: "F1 Score",
      value: `${stats.f1}%`,
      icon: Shield,
      color: "text-foreground",
      ocid: "dashboard.stat.item.5",
    },
  ];

  return (
    <div className="min-h-screen bg-background font-sans">
      <Toaster />

      {/* HEADER */}
      <header
        className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-border shadow-xs"
        data-ocid="header.section"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-teal flex items-center justify-center">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              SpamGaze
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => item.ref && scrollTo(item.ref)}
                className="text-sm font-medium text-muted-foreground hover:text-teal transition-colors"
                data-ocid={`nav.${item.label.toLowerCase().replace(/ /g, "_")}.link`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="relative py-24 px-4"
        style={{
          background: "linear-gradient(135deg, #0e1f2c 0%, #1c3140 100%)",
        }}
        data-ocid="hero.section"
      >
        <div className="max-w-3xl mx-auto text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight"
          >
            AI-Powered SMS Spam Detection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-blue-100 max-w-xl mx-auto"
          >
            Powered by a Naive Bayes NLP model with token-level analysis.
            Instantly classify SMS messages as spam or legitimate.
          </motion.p>
        </div>

        {/* Classifier Card */}
        <motion.div
          ref={demoRef}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6"
          data-ocid="classifier.card"
        >
          <label
            htmlFor="sms-input"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            Enter SMS Message
          </label>
          <Textarea
            id="sms-input"
            data-ocid="classifier.textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste or type an SMS message here..."
            className="min-h-[100px] resize-none text-sm mb-4"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                handleClassify();
            }}
          />
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(SPAM_SAMPLE)}
              data-ocid="classifier.spam_sample.button"
              className="text-xs"
            >
              <AlertTriangle className="w-3 h-3 mr-1 text-spam" /> Try Spam
              Sample
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMessage(HAM_SAMPLE)}
              data-ocid="classifier.ham_sample.button"
              className="text-xs"
            >
              <CheckCircle className="w-3 h-3 mr-1 text-teal" /> Try Ham Sample
            </Button>
          </div>
          <Button
            data-ocid="classifier.submit_button"
            className="w-full bg-teal hover:bg-teal-dark text-white font-semibold h-11"
            onClick={handleClassify}
            disabled={isClassifying}
          >
            {isClassifying ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4" /> Classify Message
              </span>
            )}
          </Button>
        </motion.div>

        {/* Results Panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-2xl mx-auto mt-4"
              data-ocid="results.panel"
            >
              <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {result.label === "spam" ? (
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-teal-light" />
                    )}
                    <span
                      className={`text-2xl font-bold ${
                        result.label === "spam"
                          ? "text-red-400"
                          : "text-teal-light"
                      }`}
                    >
                      {result.label.toUpperCase()}
                    </span>
                  </div>
                  <Badge
                    className={`text-sm px-3 py-1 ${
                      result.label === "spam"
                        ? "bg-red-500/20 text-red-300 border-red-400/30"
                        : "bg-teal/20 text-teal-light border-teal/30"
                    }`}
                    variant="outline"
                    data-ocid="results.label.badge"
                  >
                    {Math.round(result.confidence * 100)}% Confident
                  </Badge>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/60">Spam Probability</span>
                    <span className="font-semibold">
                      {Math.round(result.spamProbability * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(result.spamProbability * 100)}%`,
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(to right, #1b7f84, #b63a3a)",
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-3 mb-4">
                  <p className="text-xs text-white/50 mb-2 font-medium">
                    Message Analysis
                  </p>
                  <p className="text-sm leading-relaxed">
                    <TokenHighlight message={message} result={result} />
                  </p>
                </div>

                {result.topContributors.length > 0 && (
                  <div>
                    <p className="text-xs text-white/50 mb-2 font-medium">
                      Key Tokens
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.topContributors.map((t) => (
                        <span
                          key={t.token}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            t.type === "spam"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-teal/20 text-teal-light"
                          }`}
                          data-ocid="results.token.badge"
                        >
                          {t.token}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* DASHBOARD */}
      <section
        ref={dashRef}
        className="py-16 px-4 bg-background"
        data-ocid="dashboard.section"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Model History &amp; Insights Dashboard
            </h2>
            <p className="text-muted-foreground mt-1">
              Real-time classification metrics and history
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-4 shadow-card border border-border"
                data-ocid={stat.ocid}
              >
                <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Spam vs Ham Trends
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  All time
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, barIdx) => (
                      <Cell
                        key={entry.name}
                        fill={BAR_COLORS[barIdx % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl p-5 shadow-card border border-border overflow-hidden">
              <h3 className="font-semibold text-foreground mb-4">
                Recent Classifications
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">ID</TableHead>
                      <TableHead className="text-xs">Time</TableHead>
                      <TableHead className="text-xs">Message</TableHead>
                      <TableHead className="text-xs">Label</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRecords.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground text-sm py-8"
                          data-ocid="dashboard.table.empty_state"
                        >
                          No classifications yet. Try the demo above!
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentRecords.map((rec, rowIdx) => (
                        <TableRow
                          key={String(rec.id)}
                          data-ocid={`dashboard.table.row.item.${rowIdx + 1}`}
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            #{String(rec.id)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTime(rec.timestamp)}
                          </TableCell>
                          <TableCell className="text-xs max-w-[140px] truncate">
                            {rec.message}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs font-semibold ${
                                rec.classificationLabel === Label.spam
                                  ? "text-spam"
                                  : "text-teal"
                              }`}
                            >
                              {rec.classificationLabel === Label.spam
                                ? "SPAM"
                                : "HAM"}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">
                            {Math.round(rec.confidence * 100)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NLP Pipeline + Features */}
      <section
        ref={pipelineRef}
        className="py-16 px-4 bg-white border-t border-border"
        data-ocid="pipeline.section"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Our NLP Pipeline
              </h2>
              <ol className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Tokenization",
                    desc: "Lowercase, split on whitespace/punctuation, remove stopwords.",
                  },
                  {
                    step: "2",
                    title: "Token Scoring",
                    desc: "Spam indicators +0.8, ham indicators -0.8 per token.",
                  },
                  {
                    step: "3",
                    title: "Prior Injection",
                    desc: "Spam prior of -0.7 reflects that most messages are legitimate.",
                  },
                  {
                    step: "4",
                    title: "Probability Estimation",
                    desc: "Sigmoid(score x 1.5) maps total score to a spam probability.",
                  },
                  {
                    step: "5",
                    title: "Classification",
                    desc: "If P(spam) > 0.5 -> SPAM, otherwise HAM. Confidence reported.",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full bg-teal-bg text-teal flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {item.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Key Features
              </h2>
              <ul className="space-y-4">
                {[
                  {
                    icon: Brain,
                    title: "Naive Bayes Classifier",
                    desc: "Fast probabilistic model proven effective for text classification.",
                  },
                  {
                    icon: Zap,
                    title: "Real-time Analysis",
                    desc: "Sub-second classification with token-level explanations.",
                  },
                  {
                    icon: Shield,
                    title: "Token Highlighting",
                    desc: "Visual breakdown of which words drove the classification.",
                  },
                  {
                    icon: BarChart2,
                    title: "History Dashboard",
                    desc: "Track all classifications with confidence scores over time.",
                  },
                  {
                    icon: Filter,
                    title: "Configurable Vocabulary",
                    desc: "Extend spam/ham token lists to improve domain accuracy.",
                  },
                ].map((feat) => (
                  <li key={feat.title} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-lg border border-teal/30 bg-teal-bg flex items-center justify-center shrink-0">
                      <feat.icon className="w-4 h-4 text-teal" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {feat.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {feat.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="py-10 px-4"
        style={{ background: "#0e1f2c" }}
        data-ocid="footer.section"
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: "rgba(27,127,132,0.3)" }}
            >
              <Filter className="w-3.5 h-3.5 text-teal-light" />
            </div>
            <span className="text-white font-semibold">SpamGaze</span>
          </div>
          <p
            className="text-sm mb-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            AI-powered SMS spam detection using Naive Bayes NLP.
          </p>
          <div
            className="flex items-center justify-center gap-4 text-xs mt-4"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            <span
              className="cursor-pointer hover:opacity-80"
              data-ocid="footer.privacy.link"
            >
              Privacy
            </span>
            <ChevronRight className="w-3 h-3" />
            <span
              className="cursor-pointer hover:opacity-80"
              data-ocid="footer.docs.link"
            >
              Docs
            </span>
            <ChevronRight className="w-3 h-3" />
            <span
              className="cursor-pointer hover:opacity-80"
              data-ocid="footer.api.link"
            >
              API
            </span>
          </div>
          <p
            className="text-xs mt-6"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            &copy; {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              className="underline hover:text-white/40 transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

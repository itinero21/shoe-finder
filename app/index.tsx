import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

/**
 * Running Shoe Finder – single-file Expo app (App.js)
 *
 * How it works
 * - Ask a short series of questions (activity, distance, foot arch, injuries)
 * - Score a small catalog of popular models from Saucony, Hoka, Brooks, ASICS, Altra, and On
 * - Show top recommendations with reasons
 *
 * You can paste this entire file into App.js in a fresh Expo app and run `npx expo start`.
 */

// --- Tiny in-memory catalog (add/tune freely) ---
const SHOES = [
  // Saucony
  { brand: "Saucony", model: "Ride 17", stability: "neutral", cushioning: "high", dropMM: 8, archSupport: ["neutral", "high"], activity: ["run", "walk"], terrain: ["road"], notes: "Versatile daily trainer with balanced cushioning." },
  { brand: "Saucony", model: "Guide 17", stability: "stability", cushioning: "high", dropMM: 6, archSupport: ["flat", "neutral"], activity: ["run", "walk"], terrain: ["road"], notes: "Gentle guidance for mild overpronation/flat feet." },
  // Hoka
  { brand: "Hoka", model: "Clifton 9", stability: "neutral", cushioning: "high", dropMM: 5, archSupport: ["neutral", "high"], activity: ["run", "walk"], terrain: ["road"], notes: "Light, cushioned daily miles; smooth rocker." },
  { brand: "Hoka", model: "Arahi 7", stability: "stability", cushioning: "high", dropMM: 5, archSupport: ["flat", "neutral"], activity: ["run", "walk"], terrain: ["road"], notes: "Stability via J-Frame without feeling stiff." },
  // Brooks
  { brand: "Brooks", model: "Ghost 16", stability: "neutral", cushioning: "high", dropMM: 12, archSupport: ["neutral", "high"], activity: ["run", "walk"], terrain: ["road"], notes: "Classic soft ride; great for daily running/walking." },
  { brand: "Brooks", model: "Adrenaline GTS 23", stability: "stability", cushioning: "high", dropMM: 12, archSupport: ["flat", "neutral"], activity: ["run", "walk"], terrain: ["road"], notes: "GuideRails support for pronation & knee alignment." },
  // ASICS
  { brand: "ASICS", model: "Gel-Nimbus 26", stability: "neutral", cushioning: "max", dropMM: 8, archSupport: ["neutral", "high"], activity: ["run", "walk"], terrain: ["road"], notes: "Plush, max-cush for long distances and recovery." },
  { brand: "ASICS", model: "Gel-Kayano 31", stability: "stability", cushioning: "max", dropMM: 10, archSupport: ["flat", "neutral"], activity: ["run", "walk"], terrain: ["road"], notes: "Premium stability + soft cushioning for flat feet." },
  // Altra (zero-drop, foot-shaped)
  { brand: "Altra", model: "Torin 7", stability: "neutral", cushioning: "high", dropMM: 0, archSupport: ["neutral", "high"], activity: ["run", "walk"], terrain: ["road"], notes: "Foot-shaped fit; zero-drop encourages natural stride." },
  { brand: "Altra", model: "Provision 7", stability: "stability", cushioning: "high", dropMM: 0, archSupport: ["flat", "neutral"], activity: ["run", "walk"], terrain: ["road"], notes: "Subtle guidance on a zero-drop platform." },
  // On
  { brand: "On", model: "Cloudrunner", stability: "stability", cushioning: "medium", dropMM: 9, archSupport: ["flat", "neutral"], activity: ["run", "walk"], terrain: ["road"], notes: "Stable platform; good for new runners and walking." },
  { brand: "On", model: "Cloudsurfer", stability: "neutral", cushioning: "high", dropMM: 10, archSupport: ["neutral", "high"], activity: ["run", "walk"], terrain: ["road"], notes: "Softer On feel with smooth transitions." },
];

// --- Questionnaire schema ---
const QUESTIONS = [
  {
    key: "activity",
    title: "What will you mostly use the shoes for?",
    options: [
      { value: "run", label: "Running" },
      { value: "walk", label: "Walking" },
      { value: "both", label: "Both" },
    ],
  },
  {
    key: "distance",
    title: "Typical distance?",
    options: [
      { value: "short", label: "0–5 km" },
      { value: "mid", label: "5–15 km" },
      { value: "long", label: "> 15 km" },
    ],
  },
  {
    key: "arch",
    title: "Do you have flat feet?",
    options: [
      { value: "flat", label: "Yes, flat feet / overpronate" },
      { value: "neutral", label: "Neutral" },
      { value: "high", label: "High arches / supinate" },
    ],
  },
  {
    key: "injury",
    title: "Any current or recent injuries?",
    options: [
      { value: "none", label: "No injuries" },
      { value: "knee", label: "Knee pain" },
      { value: "plantar", label: "Plantar fasciitis / heel" },
      { value: "shin", label: "Shin splints" },
    ],
  },
  {
    key: "dropPref",
    title: "Heel-to-toe drop preference? (optional)",
    options: [
      { value: "any", label: "No preference" },
      { value: "low", label: "Low (0–5 mm)" },
      { value: "midDrop", label: "Medium (6–8 mm)" },
      { value: "highDrop", label: "High (9–12 mm)" },
    ],
    optional: true,
  },
];

// --- Scoring rules ---
function scoreShoe(shoe, answers) {
  let score = 0;
  const reasons = [];

  // Activity fit
  if (answers.activity === "both") {
    if (shoe.activity.includes("run") && shoe.activity.includes("walk")) {
      score += 2; reasons.push("works for running & walking");
    }
  } else if (shoe.activity.includes(answers.activity)) {
    score += 2; reasons.push(`good for ${answers.activity}`);
  }

  // Stability vs arch
  if (answers.arch === "flat" && shoe.stability === "stability") {
    score += 3; reasons.push("stability support for flat feet");
  }
  if (answers.arch === "neutral" && shoe.stability === "neutral") {
    score += 2; reasons.push("neutral support matches arch");
  }
  if (answers.arch === "high" && shoe.stability === "neutral") {
    score += 1; reasons.push("neutral shoe suits high arches");
  }

  // Distance -> cushioning
  if (answers.distance === "short" && ["medium", "high"].includes(shoe.cushioning)) {
    score += 1; reasons.push("comfortable for short outings");
  }
  if (answers.distance === "mid" && ["high", "max"].includes(shoe.cushioning)) {
    score += 2; reasons.push("cushioning for mid distances");
  }
  if (answers.distance === "long" && shoe.cushioning === "max") {
    score += 3; reasons.push("max cushioning for long runs");
  }

  // Injury guidance
  if (answers.injury === "knee" && (shoe.stability === "stability" || shoe.notes.toLowerCase().includes("alignment"))) {
    score += 2; reasons.push("added guidance may help knee loading");
  }
  if (answers.injury === "plantar" && ["high", "max"].includes(shoe.cushioning)) {
    score += 2; reasons.push("softer landing for plantar relief");
  }
  if (answers.injury === "shin" && shoe.cushioning !== "low") {
    score += 1; reasons.push("cushioning to reduce impact");
  }

  // Drop preference (optional)
  if (answers.dropPref && answers.dropPref !== "any") {
    const drop = shoe.dropMM;
    if (answers.dropPref === "low" && drop <= 5) { score += 1; reasons.push("low drop preference matched"); }
    if (answers.dropPref === "midDrop" && drop >= 6 && drop <= 8) { score += 1; reasons.push("medium drop matched"); }
    if (answers.dropPref === "highDrop" && drop >= 9) { score += 1; reasons.push("high drop matched"); }
  }

  return { score, reasons };
}

function formatReasons(reasons) {
  // Deduplicate brief reasons for a clean summary
  const seen = new Set();
  return reasons.filter(r => (seen.has(r) ? false : (seen.add(r), true))).slice(0, 3);
}

// --- UI Components ---
const Option = ({ label, selected, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: selected ? "#111827" : "#e5e7eb",
    backgroundColor: selected ? "#f3f4f6" : "#fff",
    marginRight: 10,
    marginBottom: 10,
  }}>
    <Text style={{ fontSize: 16 }}>{label}</Text>
  </TouchableOpacity>
);

const Question = ({ q, value, onChange }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>{q.title}</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {q.options.map(opt => (
        <Option
          key={opt.value}
          label={opt.label}
          selected={value === opt.value}
          onPress={() => onChange(q.key, opt.value)}
        />
      ))}
    </View>
  </View>
);

const Card = ({ children }) => (
  <View style={{
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#f3f4f6",
  }}>
    {children}
  </View>
);

const Pill = ({ children }) => (
  <View style={{ borderRadius: 999, borderWidth: 1, borderColor: "#e5e7eb", paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, marginBottom: 8 }}>
    <Text style={{ fontSize: 12 }}>{children}</Text>
  </View>
);

function ResultList({ answers }) {
  const results = useMemo(() => {
    // filter by activity broad match first
    const filtered = SHOES.filter(s => (
      answers.activity === "both" ? s.activity.includes("run") && s.activity.includes("walk") : s.activity.includes(answers.activity)
    ));

    const scored = filtered.map(shoe => ({
      ...shoe,
      ...scoreShoe(shoe, answers),
    }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return scored;
  }, [answers]);

  if (!answers.activity || !answers.distance || !answers.arch || !answers.injury) {
    return (
      <Card>
        <Text style={{ fontSize: 16 }}>Answer the questions above to see recommendations.</Text>
      </Card>
    );
  }

  return (
    <View style={{ marginTop: 6 }}>
      {results.map((s, idx) => (
        <Card key={`${s.brand}-${s.model}`}>
          <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 6 }}>{idx + 1}. {s.brand} {s.model}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
            <Pill>{s.stability}</Pill>
            <Pill>{s.cushioning} cushioning</Pill>
            <Pill>{s.dropMM} mm drop</Pill>
            <Pill>{s.terrain.join(", ")}</Pill>
          </View>
          <Text style={{ marginBottom: 8, color: "#374151" }}>{s.notes}</Text>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>Why matched: {formatReasons(s.reasons).join(" • ")}</Text>
        </Card>
      ))}
    </View>
  );
}

export default function App() {
  const [answers, setAnswers] = useState({
    activity: undefined,
    distance: undefined,
    arch: undefined,
    injury: undefined,
    dropPref: "any",
  });

  const canSeeResults = ["activity", "distance", "arch", "injury"].every(k => !!answers[k]);

  const handleChange = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));

  const reset = () => setAnswers({ activity: undefined, distance: undefined, arch: undefined, injury: undefined, dropPref: "any" });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: "900", marginBottom: 4 }}>Shoe Finder</Text>
        <Text style={{ color: "#6b7280", marginBottom: 16 }}>Answer a few quick questions. We’ll match you with models from Saucony, Hoka, Brooks, ASICS, Altra, and On.</Text>

        {QUESTIONS.map(q => (
          <Card key={q.key}>
            <Question q={q} value={answers[q.key]} onChange={handleChange} />
            {q.optional && (
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>Optional</Text>
            )}
          </Card>
        ))}

        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <TouchableOpacity onPress={reset} style={{
            backgroundColor: "#111827",
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            marginRight: 10,
          }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Reset</Text>
          </TouchableOpacity>
        </View>

        {canSeeResults && (
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Top Picks</Text>
        )}
        <ResultList answers={answers} />

        <Card>
          <Text style={{ fontSize: 14, color: "#6b7280" }}>
            Tip: These are starting points. Fit varies by foot shape. If between sizes, try both; comfort wins.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Parses the two College Board source PDFs into a structured question bank JSON.
//
// Extraction approach: pdfjs-dist per-glyph text items are reconstructed into
// lines using geometry (x position + explicit-space item width) rather than
// trusting pdftotext's layout heuristics, because the source PDFs' embedded
// font has a broken space glyph for certain kerning pairs (poppler either
// drops apostrophes/em-dashes or splits words like "support" -> "suppor t").
// A wide explicit-space item (width > 8) reliably marks a table column
// boundary (real word spaces are ~2.2-3.3pt wide in this document), so those
// become " | " delimiters, which also gives us table detection for free.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DOMAINS = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
];

const SKILLS_BY_DOMAIN = {
  "Information and Ideas": ["Central Ideas and Details", "Command of Evidence", "Inferences"],
  "Craft and Structure": ["Cross-Text Connections", "Text Structure and Purpose", "Words in Context"],
  "Expression of Ideas": ["Rhetorical Synthesis", "Transitions"],
  "Standard English Conventions": ["Boundaries", "Form, Structure, and Sense"],
};

const SKILL_TO_PROBLEM_TYPE = {
  "Central Ideas and Details": "Main Idea",
  "Command of Evidence": "Evidence",
  Inferences: "Inference",
  "Cross-Text Connections": "Rhetorical Analysis",
  "Text Structure and Purpose": "Rhetorical Analysis",
  "Words in Context": "Vocabulary in Context",
  "Rhetorical Synthesis": "Notes/Synthesis",
  Transitions: "Transitions",
  Boundaries: "Grammar/Conventions",
  "Form, Structure, and Sense": "Grammar/Conventions",
};

function norm(s) {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}

function reconstructLine(items) {
  let out = "";
  for (const it of items) {
    const raw = it.str;
    if (raw === "") continue;
    if (/^\s+$/.test(raw)) {
      if (it.width > 8) {
        out = out.replace(/\s+$/, "") + " | ";
      } else if (out.length && !out.endsWith(" ") && !out.endsWith("| ")) {
        out += " ";
      }
      continue;
    }
    out += raw.replace(/\s+/g, "");
  }
  return out.replace(/\s*\|\s*$/, "").trim();
}

async function extractLines(absPath) {
  const data = new Uint8Array(fs.readFileSync(absPath));
  const doc = await getDocument({ data }).promise;
  const allLines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent({ disableCombineTextItems: true });
    const lines = new Map();
    for (const it of content.items) {
      const y = Math.round(it.transform[5] * 2) / 2;
      const x = it.transform[4];
      const width = it.width || 0;
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y).push({ str: it.str, x, width });
    }
    const ys = [...lines.keys()].sort((a, b) => b - a);
    for (const y of ys) {
      const rowItems = lines.get(y).sort((a, b) => a.x - b.x);
      const line = reconstructLine(rowItems);
      if (line) allLines.push(line);
    }
  }
  return allLines;
}

// Finds how many raw characters of `str` (ignoring non-letters) correspond
// to `normPrefix.length` normalized (letters-only, lowercased) characters.
function findCharLength(str, normPrefix) {
  let count = 0;
  for (let idx = 0; idx < str.length; idx++) {
    if (/[a-zA-Z]/.test(str[idx])) count++;
    if (count === normPrefix.length) return idx + 1;
  }
  return str.length;
}

function longestCommonPrefixLen(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

// Picks whichever known vocabulary term (from `candidates`) shares the
// longest normalized prefix with `text`. Used for both domain and skill
// matching since the term may be complete within `text` or only partially
// present (wrapping onto a following physical line).
function bestVocabMatch(text, candidates) {
  const t = norm(text);
  let best = null;
  let bestLen = 0;
  for (const c of candidates) {
    const len = longestCommonPrefixLen(t, norm(c));
    if (len > bestLen) {
      bestLen = len;
      best = c;
    }
  }
  return { match: best, lcpLen: bestLen };
}

// Parses the "SAT | Reading and Writing | <domain> | <skill> | <difficulty>"
// metadata line using known vocabulary (rather than positional column
// parsing) because the source PDF drops the pipe/space delimiter exactly
// when a domain or skill value is about to wrap onto a second physical
// line, and domain/skill can wrap independently of one another.
function parseMetadata(lines, i) {
  let line1 = lines[i].replace(/^SAT\s*\|?\s*/, "").replace(/^Reading and Writing\s*\|?\s*/, "");
  let consumed = 1;
  const next = lines[i + 1];
  const hasLine2 = !!next && next !== "Question" && !next.startsWith("SAT");
  if (hasLine2) consumed = 2;
  const line2 = hasLine2 ? next : "";

  const diffMatch = line1.match(/(Easy|Medium|Hard)/);
  const difficulty = diffMatch ? diffMatch[1] : null;
  const remainder1 = (line1.slice(0, diffMatch ? diffMatch.index : line1.length) + line1.slice(diffMatch ? diffMatch.index + diffMatch[1].length : line1.length)).replace(/[\s|]+$/, "");

  const { match: domain, lcpLen: domainLcp } = bestVocabMatch(remainder1, DOMAINS);
  if (!domain) throw new Error(`Failed to identify domain near line ${i}: ${JSON.stringify(lines.slice(i, i + 3))}`);
  const domainNormLen = norm(domain).length;
  const skillPart1 = remainder1.slice(findCharLength(remainder1, norm(remainder1).slice(0, Math.min(domainLcp, domainNormLen)))).replace(/^[\s|]+/, "");

  let skillPart2 = "";
  if (domainLcp < domainNormLen && line2) {
    // domain wraps onto line2; the remaining domain chars sit at the front of line2
    const neededSuffix = norm(domain).slice(domainLcp);
    const cut = findCharLength(line2, neededSuffix);
    skillPart2 = line2.slice(cut).replace(/^[\s|]+/, "");
  } else {
    skillPart2 = line2;
  }

  const skillCandidates = SKILLS_BY_DOMAIN[domain];
  const { match: skill } = bestVocabMatch(skillPart1 + skillPart2, skillCandidates);

  if (!skill || !difficulty) {
    throw new Error(`Failed to parse metadata near line ${i}: ${JSON.stringify(lines.slice(i, i + 3))}`);
  }
  return { domain, skill, difficulty, consumed };
}

function parseChoices(lines) {
  const choices = {};
  let current = null;
  for (const line of lines) {
    const m = line.match(/^([A-D])\.\s*(.*)$/);
    if (m) {
      current = m[1];
      choices[current] = m[2];
    } else if (current) {
      choices[current] += " " + line;
    }
  }
  for (const k of Object.keys(choices)) {
    choices[k] = choices[k].trim();
  }
  return choices;
}

function parseTableBlock(bodyLines) {
  // A table is a contiguous run of pipe-delimited lines within the body.
  // Returns { table: {headers, rows} | null, bodyLines: lines with table removed and replaced by a marker }
  const tableStart = bodyLines.findIndex((l) => l.includes(" | "));
  if (tableStart === -1) return { table: null, bodyLines };
  let tableEnd = tableStart;
  while (tableEnd + 1 < bodyLines.length && bodyLines[tableEnd + 1].includes(" | ")) tableEnd++;
  const tableLines = bodyLines.slice(tableStart, tableEnd + 1);
  const headers = tableLines[0].split(" | ").map((s) => s.trim());
  const rows = tableLines.slice(1).map((l) => l.split(" | ").map((s) => s.trim()));
  const title = tableStart > 0 ? bodyLines[tableStart - 1] : null;
  const newBody = [...bodyLines.slice(0, tableStart - (title ? 1 : 0)), "[[TABLE]]", ...bodyLines.slice(tableEnd + 1)];
  return { table: { title, headers, rows }, bodyLines: newBody };
}

// No blank-line info survives extraction, so a paragraph can be wrapped
// across several physical lines (e.g. the question stem itself often spans
// 2 lines). We flatten the prose into one string and find the LAST real
// sentence boundary (period/?/! followed by a capital letter or quote, not
// an abbreviation like "e.g." which is followed by a lowercase letter) —
// everything after that boundary is the question stem; everything before
// is the stimulus.
function splitStimulusAndQuestion(cleanedBody) {
  const proseLines = cleanedBody.filter((l) => l !== "[[TABLE]]");
  let flattened = proseLines.join(" ").replace(/\s+/g, " ").trim();
  // Literary-excerpt copyright bylines ("©2023 by Rachel Heng") sit between
  // the end of the stimulus and the question stem with no sentence-ending
  // punctuation of their own, which defeats the boundary regex below (the
  // capital-letter lookahead matches the byline's Title Case name instead
  // of the real next sentence). Strip them before boundary detection.
  // Matches exactly the "by <First> <Last>" token pair, not a greedy run of
  // Title Case words, so it can't also swallow a capitalized word that
  // starts the real next sentence (e.g. "...by Rachel Heng Taken together").
  flattened = flattened.replace(/©\d{4}\s+by\s+\S+\s+\S+/g, "").replace(/\s+/g, " ").trim();
  // A blank ("______") also ends a sentence in fill-in-the-blank stimuli —
  // the instruction that follows ("Which choice completes the text...")
  // has no punctuation of its own separating it from the blank.
  const boundary = /(?:[.?!]["'”)\]]*|_{2,})\s+(?=[A-Z"'“])/g;
  let lastEnd = -1;
  let m;
  while ((m = boundary.exec(flattened))) {
    lastEnd = m.index + m[0].length;
  }
  let stimulusFlat, question;
  if (lastEnd === -1) {
    // single-sentence body (rare) — treat the whole thing as the question
    stimulusFlat = "";
    question = flattened;
  } else {
    stimulusFlat = flattened.slice(0, lastEnd).trim();
    question = flattened.slice(lastEnd).trim();
  }
  // Visually separate a second passage in Cross-Text Connections questions.
  stimulusFlat = stimulusFlat.replace(/\s+(Text 2\b)/, "\n\n$1");
  const hasTable = cleanedBody.includes("[[TABLE]]");
  const stimulus = hasTable ? `[[TABLE]]\n\n${stimulusFlat}` : stimulusFlat;
  return { stimulus, question };
}

async function parseFile(lines) {
  const questions = [];
  let i = 0;
  while (i < lines.length) {
    const idMatch = lines[i].match(/^Question ID:\s*(\S+)/);
    if (!idMatch) {
      i++;
      continue;
    }
    const id = idMatch[1];
    i++;
    // header row "Assessment | Test | Domain | Skill | Difficulty"
    if (lines[i] && lines[i].startsWith("Assessment")) i++;
    const meta = parseMetadata(lines, i);
    i += meta.consumed;
    if (lines[i] !== "Question") throw new Error(`Expected 'Question' at line ${i}, got ${lines[i]}`);
    i++;
    const bodyLines = [];
    while (i < lines.length && lines[i] !== "Answer") {
      bodyLines.push(lines[i]);
      i++;
    }
    i++; // consume "Answer"
    const choiceLines = [];
    while (
      i < lines.length &&
      !lines[i].startsWith("Question ID:") &&
      lines[i] !== "Correct Answer" &&
      !lines[i].startsWith("Correct Answer:")
    ) {
      choiceLines.push(lines[i]);
      i++;
    }
    let correctAnswer = null;
    let rationaleRaw = null;
    if (lines[i] && lines[i].startsWith("Correct Answer:")) {
      correctAnswer = lines[i].replace("Correct Answer:", "").trim();
      i++;
      if (lines[i] === "Rationale") i++;
      const rationaleLines = [];
      while (i < lines.length && !lines[i].startsWith("Question ID:")) {
        rationaleLines.push(lines[i]);
        i++;
      }
      rationaleRaw = rationaleLines.join(" ");
    }

    const { table, bodyLines: cleanedBody } = parseTableBlock(bodyLines);
    const { stimulus, question: stem } = splitStimulusAndQuestion(cleanedBody);
    const choices = parseChoices(choiceLines);

    questions.push({
      id,
      assessment: "SAT",
      test: "Reading and Writing",
      domain: meta.domain,
      skill: meta.skill,
      problemType: SKILL_TO_PROBLEM_TYPE[meta.skill] || "Other",
      difficulty: meta.difficulty,
      stimulus,
      table,
      question: stem,
      choices,
      correctAnswer,
      rationaleRaw,
    });
  }
  return questions;
}

function splitRationale(rationaleRaw, correctAnswer) {
  if (!rationaleRaw) return { whyCorrect: "", whyIncorrect: "" };
  const idx = rationaleRaw.search(/Choice [A-D] is incorrect/);
  if (idx === -1) return { whyCorrect: rationaleRaw, whyIncorrect: "" };
  return {
    whyCorrect: rationaleRaw.slice(0, idx).trim(),
    whyIncorrect: rationaleRaw.slice(idx).trim(),
  };
}

// Command of Evidence questions that cite a data table are meaningfully a
// different practice skill (reading a table) than ones that cite a textual
// quotation, so we split them into their own problem type.
function refineProblemType(q) {
  if (q.skill === "Command of Evidence" && q.table) return "Data Interpretation";
  return q.problemType;
}

async function main() {
  console.log("Extracting Questions PDF...");
  const qLines = await extractLines(path.join(ROOT, "Questions_Only_CollegeBoardReading.pdf"));
  console.log("Extracting Answers PDF...");
  const aLines = await extractLines(path.join(ROOT, "Answers_Included_CollegeBoard.pdf"));

  const questionsOnly = await parseFile(qLines);
  const withAnswers = await parseFile(aLines);

  const answerMap = new Map(withAnswers.map((q) => [q.id, q]));

  const merged = questionsOnly.map((q) => {
    const a = answerMap.get(q.id);
    if (!a) throw new Error(`No answer entry found for question ${q.id}`);
    const { whyCorrect, whyIncorrect } = splitRationale(a.rationaleRaw, a.correctAnswer);
    const problemType = refineProblemType(q);
    return {
      id: q.id,
      assessment: q.assessment,
      test: q.test,
      domain: q.domain,
      skill: q.skill,
      problemType,
      difficulty: q.difficulty,
      stimulus: q.stimulus,
      table: q.table,
      question: q.question,
      choices: q.choices,
      correctAnswer: a.correctAnswer,
      rationale: {
        whyCorrect,
        whyIncorrect,
      },
    };
  });

  // Sanity checks
  for (const q of merged) {
    const letters = Object.keys(q.choices).sort();
    if (letters.join("") !== "ABCD") {
      throw new Error(`Question ${q.id} has malformed choices: ${JSON.stringify(q.choices)}`);
    }
    if (!["A", "B", "C", "D"].includes(q.correctAnswer)) {
      throw new Error(`Question ${q.id} has invalid correctAnswer: ${q.correctAnswer}`);
    }
    if (!q.stimulus || !q.question) {
      throw new Error(`Question ${q.id} missing stimulus/question`);
    }
    if (!q.question.trim().endsWith("?")) {
      console.warn(`WARN: question ${q.id} stem doesn't end in '?': ${JSON.stringify(q.question)}`);
    }
  }

  const outDir = path.join(ROOT, "src", "data");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "questions.json"), JSON.stringify(merged, null, 2), "utf8");

  const domainCounts = {};
  const skillCounts = {};
  const difficultyCounts = {};
  const problemTypeCounts = {};
  for (const q of merged) {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
    skillCounts[q.skill] = (skillCounts[q.skill] || 0) + 1;
    difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    problemTypeCounts[q.problemType] = (problemTypeCounts[q.problemType] || 0) + 1;
  }

  console.log(`\nParsed ${merged.length} questions -> src/data/questions.json`);
  console.log("By domain:", domainCounts);
  console.log("By skill:", skillCounts);
  console.log("By difficulty:", difficultyCounts);
  console.log("By problem type:", problemTypeCounts);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

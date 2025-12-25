// Simple demo data + local storage handling for dashboard & profile

const STORAGE_KEY = "smart-study-demo-state-v1";

// Curriculum derived from Pillai College of Engineering (New Panvel)
// 3rd year Computer vs IT syllabus (2023-24 NEP PDFs). App is focused
// ONLY on 3rd year, but allows choosing department (Comps / IT).
const DEPT_SUBJECTS_3RD_YEAR = {
  COMPS: [
    // Core PCE 3rd year Computer / IT subjects you specified
    {
      id: "mi",
      name: "Machine Intelligence",
      topics: [
        { id: "intro-mi", title: "Intro to Machine Intelligence", completed: false },
        { id: "search", title: "Search Algorithms", completed: false },
        { id: "learning", title: "Learning Paradigms", completed: false },
      ],
    },
    {
      id: "mpmc",
      name: "Microprocessor and Microcontroller",
      topics: [
        { id: "arch", title: "Architecture & Instruction Set", completed: false },
        { id: "interfacing", title: "Interfacing & Peripherals", completed: false },
        { id: "programming", title: "Assembly & C Programming", completed: false },
      ],
    },
    {
      id: "ivp",
      name: "Image and Video Processing",
      topics: [
        { id: "fundamentals", title: "Image Fundamentals", completed: false },
        { id: "filters", title: "Spatial & Frequency Filters", completed: false },
        { id: "video", title: "Video Compression & Coding", completed: false },
      ],
    },
    {
      id: "crypto-sec",
      name: "Cryptography and Security",
      topics: [
        { id: "classical", title: "Classical Ciphers", completed: false },
        { id: "block", title: "Block Ciphers & Modes", completed: false },
        { id: "public-key", title: "Public-key & Applications", completed: false },
      ],
    },

    // Other 3rd year Comps / IT style core subjects
    {
      id: "daa",
      name: "Design & Analysis of Algorithms",
      topics: [
        { id: "divide", title: "Divide & Conquer", completed: false },
        { id: "dp", title: "Dynamic Programming", completed: false },
        { id: "greedy", title: "Greedy & Graph Algos", completed: false },
      ],
    },
    {
      id: "toc",
      name: "Theory of Computation",
      topics: [
        { id: "automata", title: "Automata & Regex", completed: false },
        { id: "cfg", title: "CFG & PDA", completed: false },
        { id: "tm", title: "Turing Machines", completed: false },
      ],
    },
    {
      id: "se",
      name: "Software Engineering",
      topics: [
        { id: "models", title: "Process Models", completed: false },
        { id: "req", title: "Requirements", completed: false },
        { id: "testing", title: "Testing", completed: false },
      ],
    },
    {
      id: "cn",
      name: "Computer Networks",
      topics: [
        { id: "layers", title: "Network Layers & Models", completed: false },
        { id: "routing", title: "Routing & Congestion Control", completed: false },
        { id: "transport", title: "TCP/UDP & QoS", completed: false },
      ],
    },
    {
      id: "compiler",
      name: "Compiler Design",
      topics: [
        { id: "lex", title: "Lexical & Parsing", completed: false },
        { id: "ir", title: "Intermediate Code", completed: false },
        { id: "opt", title: "Optimization", completed: false },
      ],
    },
    {
      id: "elective-1",
      name: "Elective I (IT / Comps)",
      topics: [
        { id: "supervised", title: "Supervised Learning", completed: false },
        { id: "unsupervised", title: "Unsupervised", completed: false },
        { id: "eval", title: "Evaluation", completed: false },
      ],
    },
  ],
  IT: [
    {
      id: "mi-it",
      name: "Machine Intelligence (IT)",
      topics: [
        { id: "intro-mi-it", title: "Intro & Problem Solving", completed: false },
        { id: "search-it", title: "AI Search Strategies", completed: false },
        { id: "ml-it", title: "Machine Learning Basics", completed: false },
      ],
    },
    {
      id: "mpmc-it",
      name: "Microprocessor and Microcontroller (IT)",
      topics: [
        { id: "arch-it", title: "Architecture & Instructions", completed: false },
        { id: "interfacing-it", title: "Interfacing", completed: false },
        { id: "prog-it", title: "Programming & Applications", completed: false },
      ],
    },
    {
      id: "ivp-it",
      name: "Image and Video Processing (IT)",
      topics: [
        { id: "img-fund-it", title: "Image Fundamentals", completed: false },
        { id: "transforms-it", title: "Transforms & Filtering", completed: false },
        { id: "video-it", title: "Video Coding", completed: false },
      ],
    },
    {
      id: "crypto-sec-it",
      name: "Cryptography and Security (IT)",
      topics: [
        { id: "crypto-basics-it", title: "Basics & Classical Ciphers", completed: false },
        { id: "symmetric-it", title: "Symmetric Techniques", completed: false },
        { id: "asymmetric-it", title: "Asymmetric & PKI", completed: false },
      ],
    },
    {
      id: "se-it",
      name: "Software Engineering (IT)",
      topics: [
        { id: "models-it", title: "Lifecycle Models", completed: false },
        { id: "design-it", title: "Design & Architecture", completed: false },
        { id: "qa-it", title: "Quality & Testing", completed: false },
      ],
    },
    {
      id: "cn-it",
      name: "Computer Networks (IT)",
      topics: [
        { id: "layers-it", title: "Layers & Protocols", completed: false },
        { id: "routing-it", title: "Routing Protocols", completed: false },
        { id: "transport-it", title: "Transport & Congestion", completed: false },
      ],
    },
    {
      id: "elective-1-it",
      name: "Elective I (IT)",
      topics: [
        { id: "topic1-it", title: "Elective Topic 1", completed: false },
        { id: "topic2-it", title: "Elective Topic 2", completed: false },
      ],
    },
  ],
};

const defaultState = {
  profile: {
    name: "Student Name",
    email: "student@example.com",
    department: "COMPS",
    year: "3rd Year",
    semester: "Sem 5",
    subjectsLabel:
      "3rd Year PCE subjects based on chosen department (Comps / IT)",
    targetDate: "",
  },
  subjects: structuredClone(DEPT_SUBJECTS_3RD_YEAR.COMPS),
};

function subjectsFromYearAndDept(year, department) {
  // App is locked to 3rd year; we still check year for future extensibility.
  if (year !== "3rd Year") return structuredClone(DEPT_SUBJECTS_3RD_YEAR.COMPS);
  const key = department === "IT" ? "IT" : "COMPS";
  return structuredClone(DEPT_SUBJECTS_3RD_YEAR[key]);
}

function deriveSubjectsLabel(subjects) {
  if (!subjects || !subjects.length) return "—";
  return subjects.map((s) => s.name).join(", ");
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    const mergedProfile = {
      ...structuredClone(defaultState.profile),
      ...(parsed.profile || {}),
    };
    const subjectsByYearAndDept = subjectsFromYearAndDept(
      mergedProfile.year,
      mergedProfile.department
    );
    const mergedSubjects =
      parsed.subjects || structuredClone(subjectsByYearAndDept);
    const mergedLabel =
      mergedProfile.subjectsLabel ||
      deriveSubjectsLabel(parsed.subjects || subjectsByYearAndDept);

    return {
      ...structuredClone(defaultState),
      ...parsed,
      profile: { ...mergedProfile, subjectsLabel: mergedLabel },
      subjects: mergedSubjects,
    };
  } catch (e) {
    console.warn("Failed to parse stored state, resetting.", e);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

// ------- DOM helpers -------

const $ = (id) => document.getElementById(id);

function switchView(view) {
  const dashView = $("view-dashboard");
  const profView = $("view-profile");
  const dashTab = $("tab-dashboard");
  const profTab = $("tab-profile");

  if (view === "dashboard") {
    dashView.classList.add("active");
    profView.classList.remove("active");
    dashTab.classList.add("active");
    profTab.classList.remove("active");
  } else {
    dashView.classList.remove("active");
    profView.classList.add("active");
    dashTab.classList.remove("active");
    profTab.classList.add("active");
  }
}

// ------- Progress calculation -------

function computeSubjectProgress(subject) {
  const total = subject.topics.length || 1;
  const completed = subject.topics.filter((t) => t.completed).length;
  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100),
  };
}

function computeOverallProgress() {
  let totalTopics = 0;
  let completedTopics = 0;
  state.subjects.forEach((s) => {
    totalTopics += s.topics.length;
    completedTopics += s.topics.filter((t) => t.completed).length;
  });
  if (!totalTopics) return 0;
  return Math.round((completedTopics / totalTopics) * 100);
}

// ------- Render functions -------

function renderSummary() {
  const { year, semester, targetDate } = state.profile;
  $("summary-year").textContent = year || "—";
  $("summary-semester").textContent = semester || "—";
  $("summary-subjects").textContent = deriveSubjectsLabel(state.subjects);
  $("summary-target").textContent = targetDate || "—";

  const overall = computeOverallProgress();
  $("overall-progress-label").textContent = `${overall}%`;
  const ring = $("overall-ring");
  ring.setAttribute("stroke-dasharray", `${overall}, 100`);
  ring.style.stroke = overall >= 80 ? "#22c55e" : overall >= 40 ? "#facc15" : "#f97316";
}

function renderSubjects() {
  const container = $("subjects-container");
  container.innerHTML = "";

  state.subjects.forEach((subject) => {
    const stats = computeSubjectProgress(subject);
    const card = document.createElement("article");
    card.className = "subject-card";

    card.innerHTML = `
      <div class="subject-header">
        <div>
          <div class="subject-title">${subject.name}</div>
        </div>
        <div class="subject-meta">
          <span class="pill ${stats.percent === 100 ? "success" : ""}">
            ${stats.completed}/${stats.total} topics
          </span>
          <div class="subject-progress-bar">
            <div class="subject-progress-fill" style="width: ${stats.percent}%"></div>
          </div>
          <div class="subject-progress-label">
            <span>${stats.percent}%</span>
            <span>${stats.percent === 100 ? "Great job!" : "Keep going"}</span>
          </div>
        </div>
      </div>
      <ul class="topics-list">
        ${subject.topics
          .map(
            (t) => `
          <li class="topic-item">
            <input type="checkbox"
              data-subject-id="${subject.id}"
              data-topic-id="${t.id}"
              ${t.completed ? "checked" : ""} />
            <div class="topic-title">
              ${t.title}
              <div class="topic-meta">
                ${t.completed ? "Studied • Quiz unlocked" : "Not studied yet"}
              </div>
            </div>
          </li>
        `
          )
          .join("")}
      </ul>
      <div class="subject-actions">
        <button class="btn primary" type="button" data-quiz-for="${subject.id}">
          Open Quiz (Coming soon)
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  container.addEventListener("change", (e) => {
    const target = e.target;
    if (target.matches('input[type="checkbox"][data-subject-id]')) {
      const subjectId = target.getAttribute("data-subject-id");
      const topicId = target.getAttribute("data-topic-id");
      toggleTopicCompletion(subjectId, topicId, target.checked);
    }
  });

  container.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-quiz-for]");
    if (!btn) return;
    const subjectId = btn.getAttribute("data-quiz-for");
    const subject = state.subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    alert(
      `Quiz for "${subject.name}" will be available in the full version.\nFor now, focus on completing topics!`
    );
  });
}

function renderProfile() {
  const { name, email, year, semester, department, targetDate } = state.profile;

  $("profile-name").value = name || "";
  $("profile-email").value = email || "";
  $("profile-department").value = department || "COMPS";
  $("profile-year").value = year || "";
  $("profile-semester").value = semester || "";
  $("profile-subjects").value = deriveSubjectsLabel(state.subjects);
  $("profile-target-date").value = targetDate || "";

  $("profile-name-display").textContent = name || "Student Name";
  $("profile-email-display").textContent = email || "student@example.com";
  $("profile-year-semester-pill").textContent = `${year || "Year —"} • ${
    semester || "Sem —"
  }`;

  // Avatar initial
  const initial = (name || "S").trim().charAt(0).toUpperCase() || "S";
  document.querySelector(".avatar").textContent = initial;

  // Subject-wise progress overview
  const list = $("profile-progress-list");
  list.innerHTML = "";
  state.subjects.forEach((s) => {
    const p = computeSubjectProgress(s);
    const row = document.createElement("div");
    row.className = "profile-progress-row";
    row.innerHTML = `
      <span>${s.name}</span>
      <div class="profile-progress-bar">
        <div class="profile-progress-fill" style="width: ${p.percent}%"></div>
      </div>
      <span><strong>${p.percent}%</strong></span>
    `;
    list.appendChild(row);
  });
}

// ------- Actions -------

function toggleTopicCompletion(subjectId, topicId, completed) {
  const subject = state.subjects.find((s) => s.id === subjectId);
  if (!subject) return;
  const topic = subject.topics.find((t) => t.id === topicId);
  if (!topic) return;
  topic.completed = completed;
  saveState();
  renderSummary();
  renderSubjects();
  renderProfile();
}

function enableProfileEditing(editing) {
  const fields = [
    "profile-name",
    "profile-department",
    "profile-year",
    "profile-semester",
    "profile-target-date",
  ];
  fields.forEach((id) => {
    const el = $(id);
    el.disabled = !editing;
  });
  $("profile-subjects").disabled = true; // always synced from year
  $("profile-email").disabled = true; // always readonly
  $("btn-save-profile").disabled = !editing;
  $("btn-edit-profile").textContent = editing ? "Cancel" : "Edit";
}

function resetProgress() {
  if (!confirm("This will uncheck all topics for all subjects. Continue?")) return;
  state.subjects.forEach((s) =>
    s.topics.forEach((t) => {
      t.completed = false;
    })
  );
  saveState();
  renderSummary();
  renderSubjects();
  renderProfile();
}

// ------- Event wiring -------

function wireNav() {
  $("tab-dashboard").addEventListener("click", () => switchView("dashboard"));
  $("tab-profile").addEventListener("click", () => switchView("profile"));
}

function wireProfileForm() {
  const form = $("profile-form");
  const btnEdit = $("btn-edit-profile");
  const btnReset = $("btn-reset-progress");

  let editing = false;
  let cachedYear = state.profile.year;
  let cachedDept = state.profile.department;
  enableProfileEditing(false);

  btnEdit.addEventListener("click", () => {
    editing = !editing;
    // reload state if cancelling
    if (!editing) {
      state = loadState();
      renderProfile();
      cachedYear = state.profile.year;
    }
    enableProfileEditing(editing);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const newYear = $("profile-year").value;
    const newDept = $("profile-department").value || "COMPS";

    state.profile.name = $("profile-name").value.trim() || "Student Name";
    state.profile.year = newYear;
    state.profile.department = newDept;
    state.profile.semester = $("profile-semester").value;
    state.profile.targetDate = $("profile-target-date").value;

    // If department changed (or year, in future), refresh subjects from syllabus
    if ((newYear && newYear !== cachedYear) || newDept !== cachedDept) {
      state.subjects = subjectsFromYearAndDept(newYear, newDept);
    }
    state.profile.subjectsLabel = deriveSubjectsLabel(state.subjects);
    cachedYear = newYear;
    cachedDept = newDept;

    saveState();
    renderSummary();
    renderProfile();
    editing = false;
    enableProfileEditing(false);
  });

  btnReset.addEventListener("click", resetProgress);
}

// ------- Init -------

document.addEventListener("DOMContentLoaded", () => {
  wireNav();
  wireProfileForm();
  renderSummary();
  renderSubjects();
  renderProfile();
});



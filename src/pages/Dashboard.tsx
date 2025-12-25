import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProfileSection from "./ProfileSection";
import styles from "./dashboard.module.css";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";


interface Topic {
  id: string;
  title: string;
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

const DEPT_SUBJECTS_3RD_YEAR: Record<string, Subject[]> = {
  COMPS: [
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
  ],
};

const STORAGE_KEY = "smart-study-demo-state-v1";

const defaultState = {
  profile: {
    name: "Student Name",
    email: "student@example.com",
    department: "COMPS",
    year: "3rd Year",
    semester: "Sem 5",
    subjectsLabel: "3rd Year PCE subjects based on chosen department (Comps / IT)",
    targetDate: "",
  },
  subjects: DEPT_SUBJECTS_3RD_YEAR.COMPS,
};

const Dashboard = () => {
  const { logout } = useAuth();
const navigate = useNavigate();

const handleLogout = async () => {
  await logout();
  navigate("/", { replace: true });
};

  const [view, setView] = useState<"dashboard" | "profile">("dashboard");
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return defaultState;
      const parsed = JSON.parse(stored);
      return {
        ...defaultState,
        ...parsed,
        subjects: parsed.subjects || defaultState.subjects,
      };
    } catch {
      return defaultState;
    }
  });

  const computeSubjectProgress = (subject: Subject) => {
    const total = subject.topics.length || 1;
    const completed = subject.topics.filter((t) => t.completed).length;
    return {
      total,
      completed,
      percent: Math.round((completed / total) * 100),
    };
  };

  const computeOverallProgress = () => {
    let totalTopics = 0;
    let completedTopics = 0;
    state.subjects.forEach((s) => {
      totalTopics += s.topics.length;
      completedTopics += s.topics.filter((t) => t.completed).length;
    });
    if (!totalTopics) return 0;
    return Math.round((completedTopics / totalTopics) * 100);
  };

  const toggleTopicCompletion = (subjectId: string, topicId: string, completed: boolean) => {
    setState((prev) => {
      const newSubjects = prev.subjects.map((s) => {
        if (s.id === subjectId) {
          return {
            ...s,
            topics: s.topics.map((t) => (t.id === topicId ? { ...t, completed } : t)),
          };
        }
        return s;
      });
      const newState = { ...prev, subjects: newSubjects };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
      } catch (e) {
        console.warn("Failed to save to localStorage", e);
      }
      return newState;
    });
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state to localStorage", e);
    }
  }, [state]);

  // Sync to Firestore (Debounced or on significant change)
  // Logic: When state changes, if user is logged in, save to users/{uid}
  useEffect(() => {
    const saveToFirestore = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await setDoc(doc(db, "users", user.uid), {
          dashboardState: state
        }, { merge: true });
      } catch (e) {
        console.warn("Failed to sync to Firestore", e);
      }
    };

    const timeoutId = setTimeout(saveToFirestore, 2000); // 2s debounce
    return () => clearTimeout(timeoutId);
  }, [state]);

  // Load from Firestore on mount
  useEffect(() => {
    const fetchFromFirestore = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.dashboardState) {
            // Merge remote state
            setState(prev => ({
              ...prev,
              ...data.dashboardState
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard state:", error);
      }
    };

    // Attempt fetch after a brief delay to ensure auth is ready (or use onAuthStateChanged listener, 
    // but for this component, a simple check might suffice if already redirected)
    fetchFromFirestore();
  }, []);

  const overallProgress = computeOverallProgress();

  return (
    <div id="legacy-dashboard-root" className={styles.appShell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>SS</span>
          <div className={styles.brandText}>
            <h1>Smart Study Planner</h1>
            <p className={styles.brandSubtitle}>Dashboard & Profile</p>
          </div>
        </div>
        <nav className={styles.navTabs}>
          <button
  onClick={handleLogout}
  className={styles.navTab}
  style={{ color: "#ef4444" }}
>
  Logout
</button>

          <button
            id="tab-dashboard"
            className={`${styles.navTab} ${view === "dashboard" ? styles.active : ""}`}
            onClick={() => setView("dashboard")}
          >
            Dashboard
          </button>
          <button
            id="tab-profile"
            className={`${styles.navTab} ${view === "profile" ? styles.active : ""}`}
            onClick={() => setView("profile")}
          >
            Profile
          </button>
        </nav>
      </header>

      <main className={styles.mainContent}>
        {view === "dashboard" ? (
          <>
            <section className={styles.summaryGrid}>
              <div className={`${styles.card} ${styles.summaryCard}`}>
                <h2>Overall Progress</h2>
                <div className={styles.progressRingWrapper}>
                  <div className={styles.progressRing}>
                    <svg viewBox="0 0 36 36">
                      <path
                        className={styles.ringBg}
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                      ></path>
                      <path
                        className={styles.ringProgress}
                        strokeDasharray={`${overallProgress}, 100`}
                        style={{
                          stroke: overallProgress >= 80 ? "#22c55e" : overallProgress >= 40 ? "#facc15" : "#f97316",
                        }}
                        d="M18 2.0845
                           a 15.9155 15.9155 0 0 1 0 31.831
                           a 15.9155 15.9155 0 0 1 0 -31.831"
                      ></path>
                    </svg>
                    <div className={styles.ringLabel}>
                      <span>{overallProgress}%</span>
                      <small>Completed</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} ${styles.summaryCard}`}>
                <h2>Current Plan</h2>
                <dl className={styles.summaryList}>
                  <div>
                    <dt>Academic Year</dt>
                    <dd>{state.profile.year || "—"}</dd>
                  </div>
                  <div>
                    <dt>Semester</dt>
                    <dd>{state.profile.semester || "—"}</dd>
                  </div>
                  <div>
                    <dt>Subjects</dt>
                    <dd>{state.profile.subjectsLabel || "—"}</dd>
                  </div>
                  <div>
                    <dt>Target Completion</dt>
                    <dd>{state.profile.targetDate || "—"}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className={styles.subjectsSection}>
              <div className={styles.sectionHeader}>
                <h2>Subject-wise Progress</h2>
                <p className={styles.muted}>
                  Mark a topic as studied to update your dashboard in real-time.
                </p>
              </div>
              <div className={styles.subjectsGrid}>
                {state.subjects.map((subject) => {
                  const stats = computeSubjectProgress(subject);
                  return (
                    <article key={subject.id} className={styles.subjectCard}>
                      <div className={styles.subjectHeader}>
                        <div>
                          <div className={styles.subjectTitle}>{subject.name}</div>
                        </div>
                        <div className={styles.subjectMeta}>
                          <span className={`${styles.pill} ${stats.percent === 100 ? styles.success : ""}`}>
                            {stats.completed}/{stats.total} topics
                          </span>
                          <div className={styles.subjectProgressBar}>
                            <div
                              className={styles.subjectProgressFill}
                              style={{ width: `${stats.percent}%` }}
                            ></div>
                          </div>
                          <div className={styles.subjectProgressLabel}>
                            <span>{stats.percent}%</span>
                            <span>{stats.percent === 100 ? "Great job!" : "Keep going"}</span>
                          </div>
                        </div>
                      </div>
                      <ul className={styles.topicsList}>
                        {subject.topics.map((topic) => (
                          <li key={topic.id} className={styles.topicItem}>
                            <input
                              type="checkbox"
                              checked={topic.completed}
                              onChange={(e) =>
                                toggleTopicCompletion(subject.id, topic.id, e.target.checked)
                              }
                            />
                            <div className={styles.topicTitle}>
                              {topic.title}
                              <div className={styles.topicMeta}>
                                {topic.completed ? "Studied • Quiz unlocked" : "Not studied yet"}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className={styles.subjectActions}>
                        <button className={`${styles.btn} ${styles.primary}`} type="button">
                          Open Quiz (Coming soon)
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <div className={styles.profileLayout}>
            <section className={`${styles.card} ${styles.profileMain}`}>
              <ProfileSection state={state} setState={setState} />
            </section>

            <aside className={`${styles.card} ${styles.profileSidebar}`}>
              <h3>Progress Overview</h3>
              <div className={styles.profileProgressList}>
                {state.subjects.map((s) => {
                  const p = computeSubjectProgress(s);
                  return (
                    <div key={s.id} className={styles.profileProgressRow}>
                      <span>{s.name}</span>
                      <div className={styles.profileProgressBar}>
                        <div className={styles.profileProgressFill} style={{ width: `${p.percent}%` }}></div>
                      </div>
                      <span>
                        <strong>{p.percent}%</strong>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(148, 163, 184, 0.25)" }}>
                <Link to="/materials" className={`${styles.btn} ${styles.secondary}`} style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                  Study Materials
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className={styles.appFooter}>
        <small>
          Smart Study Planner &mdash; Demo Dashboard & Profile. Data is stored locally in your browser.
        </small>
      </footer>
    </div>
  );
};

export default Dashboard;

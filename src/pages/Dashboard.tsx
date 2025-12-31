import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ProfileSection from "./ProfileSection";
import QuizModal from "@/components/QuizModal";
import styles from "./dashboard.module.css";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from "firebase/firestore";
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
        { id: "advanced", title: "Advanced Microcontroller Applications", completed: false },
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
        { id: "complexity", title: "Complexity Analysis & NP-Completeness", completed: false },
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

const AIM_LABELS: Record<string, { title: string; range: string; description: string }> = {
  passing: { title: "Passing", range: "≈ 6.0 CGPA", description: "Just clear the bar with exam-focused, minimum-viable prep." },
  "below-average": { title: "Below Average", range: "6.5 – 7.0", description: "Cover all must-pass topics with light conceptual depth." },
  average: { title: "Average", range: "7.0 – 7.5", description: "Balanced understanding + exam practice with a safe buffer." },
  "above-average": { title: "Above Average", range: "7.5 – 8.5", description: "Deeper concepts, consistent practice and strong internals." },
  topper: { title: "Topper", range: "9.0+", description: "Max depth, advanced questions and high-intensity scheduling." },
};

const Dashboard = () => {
  const { logout, currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const [view, setView] = useState<"dashboard" | "profile">("dashboard");
  const [openQuizzes, setOpenQuizzes] = useState<Set<string>>(new Set());
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [selectedQuizSubject, setSelectedQuizSubject] = useState<{ id: string; name: string; topics: string[] } | null>(null);
  const [aimProfile, setAimProfile] = useState<any>(null);
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

  const toggleTopicCompletion = async (subjectId: string, topicId: string, completed: boolean) => {
    const user = auth.currentUser;

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

    // Sync to Firestore in real-time
    if (user) {
      try {
        await setDoc(
          doc(db, "users", user.uid, "progress", `${subjectId}_${topicId}`),
          {
            subjectId,
            topicId,
            completed,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Error syncing progress to Firestore:", error);
      }
    }
  };

  const handleOpenQuiz = (subjectId: string, subjectName: string) => {
    const subject = state.subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    const topics = subject.topics.map((t) => t.title);
    setSelectedQuizSubject({ id: subjectId, name: subjectName, topics });
    setQuizModalOpen(true);
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

  // Load AIM profile and dashboard state from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchFromFirestore = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Load AIM profile
          if (data.academicProfile) {
            setAimProfile(data.academicProfile);
          }

          // Load dashboard state
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

    // Load progress from Firestore
    const loadProgress = async () => {
      try {
        // Get all progress documents for this user
        const progressCollection = collection(db, "users", user.uid, "progress");
        const progressSnapshot = await getDocs(progressCollection);

        if (!progressSnapshot.empty) {
          setState((prev) => {
            const newSubjects = prev.subjects.map((subject) => {
              const subjectTopics = subject.topics.map((topic) => {
                const progressDoc = progressSnapshot.docs.find(
                  (doc) => doc.data().subjectId === subject.id && doc.data().topicId === topic.id
                );
                if (progressDoc) {
                  return { ...topic, completed: progressDoc.data().completed || false };
                }
                return topic;
              });
              return { ...subject, topics: subjectTopics };
            });
            return { ...prev, subjects: newSubjects };
          });
        }
      } catch (error) {
        console.error("Error loading progress:", error);
      }
    };

    fetchFromFirestore();
    loadProgress();

    // Set up real-time listener for progress updates
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "progress"),
      (snapshot) => {
        setState((prev) => {
          const newSubjects = prev.subjects.map((subject) => {
            const subjectTopics = subject.topics.map((topic) => {
              const progressDoc = snapshot.docs.find(
                (doc) => doc.data().subjectId === subject.id && doc.data().topicId === topic.id
              );
              if (progressDoc) {
                return { ...topic, completed: progressDoc.data().completed || false };
              }
              return topic;
            });
            return { ...subject, topics: subjectTopics };
          });
          return { ...prev, subjects: newSubjects };
        });
      }
    );

    return () => unsubscribe();
  }, []);

  const overallProgress = computeOverallProgress();

  return (
    <div id="legacy-dashboard-root" className={styles.appShell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>SS</span>
          <div className={styles.brandText}>
            <h1 className="font-display">Smart Study Planner</h1>
            <p className={styles.brandSubtitle}>Dashboard</p>
          </div>
        </div>
        <nav className={styles.navTabs}>
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
          <button
            onClick={handleLogout}
            className={styles.navTab}
            style={{ color: "#ef4444" }}
          >
            Logout
          </button>
        </nav>
      </header>

      <main className={styles.mainContent}>
        {view === "dashboard" ? (
          <>
            {/* Welcome Banner with AIM Profile */}
            {aimProfile && (
              <section className={`${styles.card} ${styles.welcomeBanner}`} style={{ marginBottom: "24px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                  <div>
                    <h2 className="font-display" style={{ fontSize: "24px", marginBottom: "8px" }}>
                      Welcome, {userData?.fullName || currentUser?.displayName || "Student"}! 👋
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontWeight: "600"
                      }}>
                        Goal: {AIM_LABELS[aimProfile.aim]?.title || aimProfile.aim} ({AIM_LABELS[aimProfile.aim]?.range || ""})
                      </div>
                      <span style={{ color: "rgba(148, 163, 184, 0.8)", fontSize: "14px" }}>
                        {AIM_LABELS[aimProfile.aim]?.description || ""}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/landing")}
                    className={`${styles.btn} ${styles.secondary}`}
                    style={{ fontSize: "14px" }}
                  >
                    Edit Goal
                  </button>
                </div>
              </section>
            )}

            <section className={styles.summaryGrid}>
              <div className={`${styles.card} ${styles.summaryCard}`}>
                <h2 className="font-display">Progress</h2>
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
                <h2 className="font-display">Plan</h2>
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
                    <dd>
                      {state.profile.targetDate
                        ? new Date(state.profile.targetDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className={styles.subjectsSection}>
              <div className={styles.sectionHeader}>
                <h2 className="font-display">Subjects</h2>
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
                      <div className={styles.subjectActions} style={{ display: "flex", gap: "8px" }}>
                        <button
                          className={`${styles.btn} ${styles.secondary}`}
                          type="button"
                          onClick={() => navigate(`/subject/${encodeURIComponent(subject.name)}`)}
                          style={{ flex: 1 }}
                        >
                          📖 Study Materials
                        </button>
                        <button
                          className={`${styles.btn} ${styles.primary}`}
                          type="button"
                          onClick={() => handleOpenQuiz(subject.id, subject.name)}
                          style={{ flex: 1 }}
                        >
                          {openQuizzes.has(subject.id) ? "Quiz Active" : "📝 Open Quiz"}
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
        <small>Smart Study Planner</small>
      </footer>

      {/* Quiz Modal */}
      {selectedQuizSubject && (
        <QuizModal
          open={quizModalOpen}
          onClose={() => {
            setQuizModalOpen(false);
            setSelectedQuizSubject(null);
          }}
          subjectId={selectedQuizSubject.id}
          subjectName={selectedQuizSubject.name}
          topics={selectedQuizSubject.topics}
        />
      )}
    </div>
  );
};

export default Dashboard;

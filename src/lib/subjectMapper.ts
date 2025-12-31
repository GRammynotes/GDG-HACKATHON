/**
 * Maps subject names to subject data with topics
 * This helps convert user-selected subject names to full subject objects
 */

export interface Topic {
  id: string;
  title: string;
  completed: boolean;
}

export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
  resources?: {
    notesUrl?: string; // e.g. Drive link
    youtubeUrl?: string; // One shot video
  };
}

// Topic mappings for different subjects
const SUBJECT_TOPICS_MAP: Record<string, Topic[]> = {
  "Mathematics I": [
    { id: "matrices", title: "Matrices and Determinants", completed: false },
    { id: "vectors", title: "Vector Spaces", completed: false },
    { id: "eigen", title: "Eigenvalues & Eigenvectors", completed: false },
  ],
  "Mathematics II": [
    { id: "calculus", title: "Differential Calculus", completed: false },
    { id: "integration", title: "Integral Calculus", completed: false },
    { id: "series", title: "Series and Sequences", completed: false },
  ],
  "Physics": [
    { id: "mechanics", title: "Mechanics", completed: false },
    { id: "waves", title: "Waves and Oscillations", completed: false },
    { id: "optics", title: "Optics", completed: false },
  ],
  "Programming in C": [
    { id: "basics", title: "C Basics and Data Types", completed: false },
    { id: "functions", title: "Functions and Pointers", completed: false },
    { id: "structures", title: "Structures and File Handling", completed: false },
  ],
  "Engineering Graphics": [
    { id: "projections", title: "Orthographic Projections", completed: false },
    { id: "sections", title: "Sections of Solids", completed: false },
    { id: "development", title: "Development of Surfaces", completed: false },
  ],
  "Basic Electronics": [
    { id: "diodes", title: "Diodes and Rectifiers", completed: false },
    { id: "transistors", title: "Transistors and Amplifiers", completed: false },
    { id: "opamp", title: "Operational Amplifiers", completed: false },
  ],
  "Data Structures": [
    { id: "arrays", title: "Arrays and Linked Lists", completed: false },
    { id: "trees", title: "Trees and Graphs", completed: false },
    { id: "sorting", title: "Sorting and Searching", completed: false },
  ],
  "Environmental Science": [
    { id: "ecology", title: "Ecology and Ecosystems", completed: false },
    { id: "pollution", title: "Pollution and Control", completed: false },
    { id: "conservation", title: "Conservation", completed: false },
  ],
  "Discrete Mathematics": [
    { id: "sets", title: "Sets and Relations", completed: false },
    { id: "graphs", title: "Graph Theory", completed: false },
    { id: "combinatorics", title: "Combinatorics", completed: false },
  ],
  "OOP in Java": [
    { id: "classes", title: "Classes and Objects", completed: false },
    { id: "inheritance", title: "Inheritance and Polymorphism", completed: false },
    { id: "interfaces", title: "Interfaces and Packages", completed: false },
  ],
  "Digital Logic Design": [
    { id: "gates", title: "Logic Gates and Boolean Algebra", completed: false },
    { id: "combinational", title: "Combinational Circuits", completed: false },
    { id: "sequential", title: "Sequential Circuits", completed: false },
  ],
  "Computer Organization": [
    { id: "architecture", title: "Computer Architecture", completed: false },
    { id: "memory", title: "Memory Systems", completed: false },
    { id: "io", title: "I/O Systems", completed: false },
  ],
  "DBMS": [
    { id: "sql", title: "SQL and Relational Model", completed: false },
    { id: "normalization", title: "Normalization", completed: false },
    { id: "transactions", title: "Transactions and Concurrency", completed: false },
  ],
  "Operating Systems": [
    { id: "processes", title: "Process Management", completed: false },
    { id: "memory", title: "Memory Management", completed: false },
    { id: "files", title: "File Systems", completed: false },
  ],
  "Design & Analysis of Algorithms": [
    { id: "divide", title: "Divide & Conquer", completed: false },
    { id: "dp", title: "Dynamic Programming", completed: false },
    { id: "greedy", title: "Greedy & Graph Algos", completed: false },
    { id: "complexity", title: "Complexity Analysis & NP-Completeness", completed: false },
  ],
  "Probability & Statistics": [
    { id: "probability", title: "Probability Theory", completed: false },
    { id: "distributions", title: "Probability Distributions", completed: false },
    { id: "statistics", title: "Statistical Inference", completed: false },
  ],
  "Machine Intelligence": [
    { id: "intro-mi", title: "Intro to Machine Intelligence", completed: false },
    { id: "search", title: "Search Algorithms", completed: false },
    { id: "learning", title: "Learning Paradigms", completed: false },
  ],
  "Microprocessor and Microcontroller": [
    { id: "arch", title: "Architecture & Instruction Set", completed: false },
    { id: "interfacing", title: "Interfacing & Peripherals", completed: false },
    { id: "programming", title: "Assembly & C Programming", completed: false },
    { id: "advanced", title: "Advanced Microcontroller Applications", completed: false },
  ],
  "Image and Video Processing": [
    { id: "fundamentals", title: "Image Fundamentals", completed: false },
    { id: "filters", title: "Spatial & Frequency Filters", completed: false },
    { id: "video", title: "Video Compression & Coding", completed: false },
  ],
  "Cryptography and Security": [
    { id: "classical", title: "Classical Ciphers", completed: false },
    { id: "block", title: "Block Ciphers & Modes", completed: false },
    { id: "public-key", title: "Public-key & Applications", completed: false },
  ],
  "Theory of Computation": [
    { id: "automata", title: "Automata & Regex", completed: false },
    { id: "cfg", title: "CFG & PDA", completed: false },
    { id: "tm", title: "Turing Machines", completed: false },
  ],
  "Software Engineering": [
    { id: "models", title: "Process Models", completed: false },
    { id: "req", title: "Requirements", completed: false },
    { id: "testing", title: "Testing", completed: false },
  ],
  "Computer Networks": [
    { id: "layers", title: "Network Layers & Models", completed: false },
    { id: "routing", title: "Routing & Congestion Control", completed: false },
    { id: "transport", title: "TCP/UDP & QoS", completed: false },
  ],
  "Computer Fundamentals": [
    { id: "basics", title: "Computer Basics", completed: false },
    { id: "hardware", title: "Computer Hardware", completed: false },
    { id: "software", title: "Computer Software", completed: false },
  ],
  "C Programming": [
    { id: "basics", title: "C Basics", completed: false },
    { id: "functions", title: "Functions", completed: false },
    { id: "pointers", title: "Pointers", completed: false },
  ],
  "Mathematics": [
    { id: "algebra", title: "Algebra", completed: false },
    { id: "calculus", title: "Calculus", completed: false },
    { id: "statistics", title: "Statistics", completed: false },
  ],
  "Communication Skills": [
    { id: "writing", title: "Technical Writing", completed: false },
    { id: "presentation", title: "Presentation Skills", completed: false },
    { id: "verbal", title: "Verbal Communication", completed: false },
  ],
  "Digital Electronics": [
    { id: "gates", title: "Logic Gates", completed: false },
    { id: "circuits", title: "Digital Circuits", completed: false },
    { id: "design", title: "Circuit Design", completed: false },
  ],

  "Accounting Fundamentals": [
    { id: "basics", title: "Accounting Basics", completed: false },
    { id: "financial", title: "Financial Statements", completed: false },
    { id: "analysis", title: "Financial Analysis", completed: false },
  ],
};

/**
 * Convert subject name to subject ID (for consistency)
 */
export function getSubjectId(subjectName: string): string {
  const idMap: Record<string, string> = {
    "Mathematics I": "math1",
    "Mathematics II": "math2",
    "Physics": "physics",
    "Programming in C": "c-programming",
    "Engineering Graphics": "eng-graphics",
    "Basic Electronics": "electronics",
    "Data Structures": "ds",
    "Environmental Science": "env-science",
    "Discrete Mathematics": "discrete-math",
    "OOP in Java": "java",
    "Digital Logic Design": "dld",
    "Computer Organization": "co",
    "DBMS": "dbms",
    "Operating Systems": "os",
    "Design & Analysis of Algorithms": "daa",
    "Probability & Statistics": "prob-stats",
    "Machine Intelligence": "mi",
    "Microprocessor and Microcontroller": "mpmc",
    "Image and Video Processing": "ivp",
    "Cryptography and Security": "crypto-sec",
    "Theory of Computation": "toc",
    "Software Engineering": "se",
    "Computer Networks": "cn",
    "Computer Fundamentals": "comp-fund",
    "C Programming": "c-prog",
    "Mathematics": "math",
    "Communication Skills": "comm-skills",
    "Digital Electronics": "digital-elec",
    "Accounting Fundamentals": "accounting",
  };

  return idMap[subjectName] || subjectName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Map subject names to full subject objects with topics
 */
export function mapSubjectsToData(subjectNames: string[]): Subject[] {
  return subjectNames.map((name) => ({
    id: getSubjectId(name),
    name,
    topics: SUBJECT_TOPICS_MAP[name] || [
      { id: "topic1", title: "Topic 1", completed: false },
      { id: "topic2", title: "Topic 2", completed: false },
      { id: "topic3", title: "Topic 3", completed: false },
    ],
    resources: {
      notesUrl: "https://drive.google.com/drive/u/0/folders/1w5aD4y4aFqgJ2z6X4weG5yHq7f8j3kL_", // Default Drive Folder
      youtubeUrl: "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " full course"),
    }
  }));
}

/**
 * Get year label from number
 */
export function getYearLabel(year: number): string {
  const labels: Record<number, string> = {
    1: "1st Year",
    2: "2nd Year",
    3: "3rd Year",
    4: "4th Year",
  };
  return labels[year] || `${year}th Year`;
}

/**
 * Get semester label from number
 */
export function getSemesterLabel(semester: number): string {
  return `Semester ${semester}`;
}


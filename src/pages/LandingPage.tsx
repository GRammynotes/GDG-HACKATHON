import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles, ArrowRight, BookOpen, GraduationCap, PlayCircle, FileText, BrainCircuit, Grip, CheckCircle2, Trophy, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import AimCard from '@/components/AimCard';
import SubjectChip from '@/components/SubjectChip';
import SelectField from '@/components/SelectField';
import SummaryPanel from '@/components/SummaryPanel';
import { useAuth } from '@/contexts/AuthContext';
import { mapSubjectsToData, Subject } from '@/lib/subjectMapper';
import { generateSubjectSummary } from '@/lib/gemini';

// --- Types ---

type AimLevel = 'passing' | 'below-average' | 'average' | 'above-average' | 'topper';
type Year = 1 | 2 | 3 | 4;
type Semester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type CourseId = 'btech-cse' | 'bca';

const AIM_LABELS: Record<
    AimLevel,
    { title: string; range: string; color: string; description: string }
> = {
    passing: {
        title: 'Passing',
        range: '≈ 6.0 CGPA',
        color: 'from-emerald-500 to-emerald-400',
        description: 'Just clear the bar with exam-focused, minimum-viable prep.',
    },
    'below-average': {
        title: 'Below Average',
        range: '6.5 – 7.0',
        color: 'from-sky-500 to-sky-400',
        description: 'Cover all must-pass topics with light conceptual depth.',
    },
    average: {
        title: 'Average',
        range: '7.0 – 7.5',
        color: 'from-indigo-500 to-indigo-400',
        description: 'Balanced understanding + exam practice with a safe buffer.',
    },
    'above-average': {
        title: 'Above Average',
        range: '7.5 – 8.5',
        color: 'from-violet-500 to-violet-400',
        description: 'Deeper concepts, consistent practice and strong internals.',
    },
    topper: {
        title: 'Topper',
        range: '9.0+',
        color: 'from-amber-400 to-yellow-300',
        description: 'Max depth, advanced questions and high-intensity scheduling.',
    },
};

const COURSES: Record<CourseId, { label: string }> = {
    'btech-cse': { label: 'B.Tech CSE' },
    bca: { label: 'BCA' },
};

const YEAR_OPTIONS = [
    { value: 1, label: '1st Year' },
    { value: 2, label: '2nd Year' },
    { value: 3, label: '3rd Year' },
    { value: 4, label: '4th Year' },
];

const SEMESTER_OPTIONS = [
    { value: 1, label: 'Semester 1' },
    { value: 2, label: 'Semester 2' },
    { value: 3, label: 'Semester 3' },
    { value: 4, label: 'Semester 4' },
    { value: 5, label: 'Semester 5' },
    { value: 6, label: 'Semester 6' },
    { value: 7, label: 'Semester 7' },
    { value: 8, label: 'Semester 8' },
];

const SUBJECT_MAP: Record<CourseId, Partial<Record<Year, Partial<Record<Semester, string[]>>>>> = {
    'btech-cse': {
        1: {
            1: ['Mathematics I', 'Physics', 'Programming in C', 'Engineering Graphics'],
            2: ['Mathematics II', 'Basic Electronics', 'Data Structures', 'Environmental Science'],
        },
        2: {
            3: ['Discrete Mathematics', 'OOP in Java', 'Digital Logic Design', 'Computer Organization'],
            4: ['DBMS', 'Operating Systems', 'Design & Analysis of Algorithms', 'Probability & Statistics'],
        },
    },
    bca: {
        1: {
            1: ['Computer Fundamentals', 'C Programming', 'Mathematics', 'Communication Skills'],
            2: ['Data Structures', 'Digital Electronics', 'Operating Systems', 'Accounting Fundamentals'],
        },
    },
};

// --- Components ---

const RoadmapStep = ({ number, title, desc, icon: Icon, isLast }: { number: number, title: string, desc: string, icon: any, isLast?: boolean }) => (
    <div className="flex gap-4 relative">
        {!isLast && <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gradient-to-b from-primary/30 to-transparent" />}
        <div className="relative z-10 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-primary/20 bg-background shadow-[0_0_15px_rgba(59,130,246,0.2)]`}>
                <Icon className="w-5 h-5 text-primary" />
            </div>
        </div>
        <div className="pb-8 pt-1">
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
);

const SubjectCard = ({ subject, aim, delay }: { subject: Subject; aim: AimLevel; delay: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    const handleGenerateSummary = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (summary) return;
        setLoadingSummary(true);
        try {
            const aiSummary = await generateSubjectSummary(subject.name, aim);
            setSummary(aiSummary);
        } catch (err) {
            toast.error("Failed to get AI summary");
        } finally {
            setLoadingSummary(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group relative"
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`glass-panel p-5 cursor-pointer transition-all duration-300 hover:border-primary/30 ${isOpen ? 'ring-2 ring-primary/20' : ''}`}
            >
                <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full ${subject.topics.every(t => t.completed) ? 'bg-green-500' : 'bg-primary'}`} />
                        <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {subject.name}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">{subject.topics.length} topics</p>
                        </div>
                    </div>
                    <div className="bg-secondary/50 p-2 rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                        {isOpen ? <BrainCircuit className="w-4 h-4" /> : <Grip className="w-4 h-4" />}
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <a
                                        href={subject.resources?.notesUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors text-sm font-medium border border-blue-500/20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <FileText className="w-4 h-4" /> Notes (Drive)
                                    </a>
                                    <a
                                        href={subject.resources?.youtubeUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors text-sm font-medium border border-red-500/20"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <PlayCircle className="w-4 h-4" /> Tutorials (YT)
                                    </a>
                                </div>

                                <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                                            <Sparkles className="w-4 h-4" /> AI Insight
                                        </div>
                                        {!summary && (
                                            <button
                                                onClick={handleGenerateSummary}
                                                disabled={loadingSummary}
                                                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded transition-colors"
                                            >
                                                {loadingSummary ? "Thinking..." : "Generate Summary"}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {summary || "Click generating summary to get a quick overview and study tips for this subject tailored to your goal."}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

// --- Main Page Component ---

const LandingPage = () => {
    const navigate = useNavigate();
    // User Goals State
    const [course, setCourse] = useState<CourseId>('btech-cse');
    const [year, setYear] = useState<Year>(1);
    const [semester, setSemester] = useState<Semester>(1);
    const [aim, setAim] = useState<AimLevel>('above-average');
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const { userData, refreshUserData } = useAuth();
    const hasProfile = !!userData?.academicProfile;

    // Derived States
    const availableSubjects = useMemo(() => {
        const byCourse = SUBJECT_MAP[course];
        const byYear = byCourse?.[year];
        const list = byYear?.[semester] ?? [];
        return list;
    }, [course, year, semester]);

    // Handlers
    const handleToggleSubject = (subject: string) => {
        setSelectedSubjects((prev) =>
            prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
        );
    };

    const handleContinue = async () => {
        setIsProcessing(true);
        const payload = {
            course,
            year,
            semester,
            aim,
            subjects: selectedSubjects.length ? selectedSubjects : availableSubjects,
            updatedAt: new Date()
        };

        try {
            const user = auth.currentUser;
            if (user) {
                await setDoc(doc(db, "users", user.uid), {
                    academicProfile: payload
                }, { merge: true });

                // Refresh context
                await refreshUserData();

                // Show processing animation
                setTimeout(() => {
                    toast.success('Roadmap generated!', {
                        description: 'Your personalized study plan is ready.',
                    });
                    setIsProcessing(false);
                    // No need to navigate, state change will trigger re-render of this page to "Roadmap Mode"
                }, 2000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to save profile");
            setIsProcessing(false);
        }
    };

    // --- Loading State ---
    if (isProcessing) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent -z-10" />
                <div className="text-center py-12 space-y-8 relative z-10">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-display font-semibold text-gradient animate-fade-up">
                            Generating your Roadmap...
                        </h2>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: ROADMAP DASHBOARD (If Profile Exists) ---
    if (hasProfile) {
        const profile = userData.academicProfile;
        const currentAim = AIM_LABELS[profile.aim as AimLevel];
        const userSubjects = mapSubjectsToData(profile.subjects);

        return (
            <div className="min-h-screen bg-background relative selection:bg-primary/20">
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
                                    Hey, <span className="text-gradient capitalize">{userData.fullName?.split(' ')[0] || 'Scholar'}</span>
                                </h1>
                                <span className="px-3 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground border border-border">
                                    {profile.course.toUpperCase()} · Year {profile.year}
                                </span>
                            </div>
                            <p className="text-muted-foreground max-w-lg">
                                Your roadmap to hit <span className={`font-semibold bg-clip-text text-transparent bg-gradient-to-r ${currentAim.color}`}>{currentAim.title}</span> status is ready.
                            </p>
                        </div>

                        <div className="glass-panel p-4 flex items-center gap-4 min-w-[200px]">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${currentAim.color} bg-opacity-10 text-white shadow-lg`}>
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Goal</p>
                                <p className="font-bold text-lg">{currentAim.title}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* LEFT: The Path (Roadmap) */}
                        <div className="lg:col-span-1 space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" /> Strategy Path
                            </h2>
                            <div className="glass-panel p-6">
                                <RoadmapStep
                                    number={1}
                                    title="Foundation First"
                                    desc="Skim through the AI summaries for all subjects to get the big picture this week."
                                    icon={BrainCircuit}
                                />
                                <RoadmapStep
                                    number={2}
                                    title="Deep Dive Resources"
                                    desc="Use the provided Drive notes for unit-wise preparation. Stick to one source."
                                    icon={FileText}
                                />
                                <RoadmapStep
                                    number={3}
                                    title="Video Reinforcement"
                                    desc="Watch the 'One Shot' tutorials for topics you find confusing."
                                    icon={PlayCircle}
                                />
                                <RoadmapStep
                                    number={4}
                                    title="Final Polish"
                                    desc="Solve previous year questions (aim for 5 years) to secure that CGPA."
                                    icon={CheckCircle2}
                                    isLast
                                />
                            </div>

                            <div className="glass-panel p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/10">
                                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-primary" /> Daily Tip
                                </h3>
                                <p className="text-sm text-muted-foreground italic">
                                    "Consistency beats intensity. 30 minutes of focused study daily is better than a 10-hour binge on Sunday."
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Subjects Grid */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" /> Your Subjects ({userSubjects.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userSubjects.map((subject, idx) => (
                                    <SubjectCard
                                        key={subject.id}
                                        subject={subject}
                                        aim={profile.aim as AimLevel}
                                        delay={idx * 0.1}
                                    />
                                ))}
                            </div>

                            {userSubjects.length === 0 && (
                                <div className="text-center py-12 glass-panel border-dashed">
                                    <p className="text-muted-foreground">No subjects found. Please update your profile settings.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: GOAL SETTING (If No Profile) ---
    const aimMeta = AIM_LABELS[aim];

    return (
        <div className="min-h-screen bg-background">
            <div className="fixed inset-0 -z-10 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

            <div
                className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8"
            >
                {/* Header */}
                <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">AimSet · Goal Setting</span>
                        </div>
                        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                            Lock your academic <span className="text-gradient">AIM</span> for this semester.
                        </h1>
                        <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
                            Tell AimSet your course, semester, subjects and target band. We'll spin up a semester
                            roadmap, study material and progress model around your profile.
                        </p>
                    </div>

                    <div
                        className="glass-panel w-full max-w-xs p-5 sm:w-auto"
                    >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Selected Aim
                        </p>
                        <p className="mt-2 text-xl font-bold text-primary">
                            {aimMeta.title}
                            <span className="ml-2 text-sm font-medium text-muted-foreground">({aimMeta.range})</span>
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{aimMeta.description}</p>
                    </div>
                </header>

                {/* Main content */}
                <main className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
                    {/* Left: Goal-setting form */}
                    <section className="space-y-6">
                        <div className="glass-panel space-y-6 p-6 sm:p-8">
                            {/* Academic context */}
                            <div>
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <h2 className="section-title text-base">Academic context</h2>
                                </div>
                                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                    <SelectField
                                        label="Degree / Course"
                                        value={course}
                                        onChange={(val) => {
                                            setCourse(val as CourseId);
                                            setSelectedSubjects([]);
                                        }}
                                        options={Object.entries(COURSES).map(([id, cfg]) => ({
                                            value: id,
                                            label: cfg.label,
                                        }))}
                                    />
                                    <SelectField
                                        label="Current Year"
                                        value={year}
                                        onChange={(val) => {
                                            setYear(Number(val) as Year);
                                            setSelectedSubjects([]);
                                        }}
                                        options={YEAR_OPTIONS}
                                    />
                                    <SelectField
                                        label="Current Semester"
                                        value={semester}
                                        onChange={(val) => {
                                            setSemester(Number(val) as Semester);
                                            setSelectedSubjects([]);
                                        }}
                                        options={SEMESTER_OPTIONS}
                                    />
                                </div>
                            </div>

                            {/* Subject selection */}
                            <div className="divider pt-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                        <div>
                                            <h2 className="section-title text-base">Subjects for this semester</h2>
                                            <p className="section-subtitle">
                                                Auto-fetched from your course structure. Toggle to customize.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="pill border border-border bg-secondary/50 text-[10px] text-muted-foreground">
                                        Auto-fetched
                                    </span>
                                </div>

                                {availableSubjects.length === 0 ? (
                                    <p className="mt-4 text-sm text-amber-400">
                                        No subjects configured for this combination yet. You can extend the subject map for your college.
                                    </p>
                                ) : (
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {availableSubjects.map((subject) => {
                                            const active = selectedSubjects.includes(subject) || !selectedSubjects.length;
                                            return (
                                                <SubjectChip
                                                    key={subject}
                                                    subject={subject}
                                                    isActive={active}
                                                    onClick={() => handleToggleSubject(subject)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* AIM selection */}
                            <div className="divider pt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                        Choose your aim
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {(Object.keys(AIM_LABELS) as AimLevel[]).map((level) => {
                                        const meta = AIM_LABELS[level];
                                        return (
                                            <AimCard
                                                key={level}
                                                level={level}
                                                title={meta.title}
                                                range={meta.range}
                                                description={meta.description}
                                                color={meta.color}
                                                isActive={aim === level}
                                                onClick={() => setAim(level)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="divider flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-xs text-muted-foreground max-w-md">
                                    <p>
                                        When you continue, AimSet will create a profile instance and redirect you to the Roadmap.
                                    </p>
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={handleContinue}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn-primary gap-2"
                                >
                                    Save AIM & Continue
                                    <ArrowRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>
                    </section>

                    {/* Right: Summary panel */}
                    <section className="space-y-6">
                        <SummaryPanel
                            course={COURSES[course]?.label ?? '—'}
                            year={YEAR_OPTIONS.find((y) => y.value === year)?.label ?? '—'}
                            semester={SEMESTER_OPTIONS.find((s) => s.value === semester)?.label ?? '—'}
                            aimTitle={aimMeta.title}
                            aimRange={aimMeta.range}
                            subjects={selectedSubjects.length ? selectedSubjects : availableSubjects}
                        />

                        <div className="glass-panel p-5 sm:p-6">
                            <h2 className="section-title flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Quick walkthrough
                            </h2>
                            <ol className="mt-4 list-decimal space-y-2 text-sm text-muted-foreground pl-5 marker:text-primary">
                                <li>Select your course, year and semester.</li>
                                <li>Watch subjects auto-appear — toggle to match your load.</li>
                                <li>Click through AIM levels and see how targets change.</li>
                                <li>Hit "Save AIM & Continue" to see your personal roadmap.</li>
                            </ol>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default LandingPage;

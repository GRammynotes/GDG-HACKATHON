import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Calculator, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "degree" | "year" | "semester" | "performance" | "goal" | "processing";

const degreeOptions = ["BTech", "BE", "BSc", "Other"];
const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const semestersByYear: Record<string, string[]> = {
  "1st Year": ["1st Semester", "2nd Semester"],
  "2nd Year": ["3rd Semester", "4th Semester"],
  "3rd Year": ["5th Semester", "6th Semester"],
  "4th Year": ["7th Semester", "8th Semester"],
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("degree");
  const [isAnimating, setIsAnimating] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  // Visual selections (what user sees)
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");

  // Performance inputs
  const [sem2, setSem2] = useState("");
  const [sem3, setSem3] = useState("");
  const [sem4, setSem4] = useState("");
  const [average, setAverage] = useState<number | null>(null);
  const [animatedAverage, setAnimatedAverage] = useState(0);

  // Goal
  const [selectedGoal, setSelectedGoal] = useState("");

  // Normalized data (internal - always BTech, 3rd Year, 5th Sem)
  const normalizedData = {
    degree: "BTech",
    year: "3rd Year",
    semester: "5th Semester",
  };

  const transitionToStep = (nextStep: Step) => {
    setIsAnimating(true);
    setFadeIn(false);
    setTimeout(() => {
      setStep(nextStep);
      setFadeIn(true);
      setIsAnimating(false);
    }, 300);
  };

  const handleDegreeSelect = (degree: string) => {
    setSelectedDegree(degree);
    setTimeout(() => transitionToStep("year"), 400);
  };

  const handleYearSelect = (year: string) => {
    setSelectedYear(year);
    setTimeout(() => transitionToStep("semester"), 400);
  };

  const handleSemesterSelect = (semester: string) => {
    setSelectedSemester(semester);
    setTimeout(() => transitionToStep("performance"), 400);
  };

  const calculateAverage = () => {
    const values = [parseFloat(sem2), parseFloat(sem3), parseFloat(sem4)].filter(
      (v) => !isNaN(v)
    );
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      animateAverage(avg);
    }
  };

  const animateAverage = (target: number) => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = animatedAverage;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * easeOut;

      setAnimatedAverage(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAverage(target);
      }
    };

    requestAnimationFrame(animate);
  };

  const handlePerformanceContinue = () => {
    if (average !== null) {
      transitionToStep("goal");
    }
  };

  const getGoalSuggestion = () => {
    if (average === null) return null;
    if (average < 8.0) {
      const needed = Math.min(10, (8.0 * 5 - average * 4)).toFixed(1);
      return {
        text: `To reach an overall 8.0 average, you need to score ${needed} this semester.`,
        highlight: needed,
      };
    } else if (average >= 8.5) {
      return {
        text: "You're performing at a topper level. Aim for 9.0+ this semester.",
        highlight: "9.0+",
      };
    } else {
      return {
        text: "You're on track. Scoring 8.0 keeps your consistency strong.",
        highlight: "8.0",
      };
    }
  };

  const goalOptions = ["7.5", "8.0", "8.5", "9.0", "9.5+"];

  const handleGoalSelect = (goal: string) => {
    setSelectedGoal(goal);
    setTimeout(() => transitionToStep("processing"), 400);
  };

  useEffect(() => {
  if (step === "processing") {
    const timer = setTimeout(async () => {
      const user = auth.currentUser;
      if (!user) return;

      await setDoc(
        doc(db, "users", user.uid),
        {
          onboardingCompleted: true,
        },
        { merge: true }
      );

      navigate("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [step, navigate]);


  const suggestion = getGoalSuggestion();

  return (
    <div className="min-h-screen bg-ai-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ai-blue/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ai-purple/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-ai-teal/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Main Card */}
      <div className="glass-card gradient-border w-full max-w-lg p-8 relative">
        <div
          className={cn(
            "transition-all duration-300",
            fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {/* Step: Degree */}
          {step === "degree" && (
            <StepContainer title="Which degree are you pursuing?">
              <div className="grid grid-cols-2 gap-3">
                {degreeOptions.map((degree) => (
                  <OptionButton
                    key={degree}
                    label={degree}
                    selected={selectedDegree === degree}
                    onClick={() => handleDegreeSelect(degree)}
                  />
                ))}
              </div>
            </StepContainer>
          )}

          {/* Step: Year */}
          {step === "year" && (
            <StepContainer title="Which year are you currently in?">
              <div className="grid grid-cols-2 gap-3">
                {yearOptions.map((year) => (
                  <OptionButton
                    key={year}
                    label={year}
                    selected={selectedYear === year}
                    onClick={() => handleYearSelect(year)}
                  />
                ))}
              </div>
            </StepContainer>
          )}

          {/* Step: Semester */}
          {step === "semester" && (
            <StepContainer title="Which semester are you in?">
              <div className="grid grid-cols-2 gap-3">
                {(semestersByYear[selectedYear] || semestersByYear["3rd Year"]).map((sem) => (
                  <OptionButton
                    key={sem}
                    label={sem}
                    selected={selectedSemester === sem}
                    onClick={() => handleSemesterSelect(sem)}
                  />
                ))}
              </div>
            </StepContainer>
          )}

          {/* Step: Performance */}
          {step === "performance" && (
            <StepContainer title="What's your average pointer from the last 3 semesters?">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <PointerInput
                    label="Sem 2"
                    value={sem2}
                    onChange={setSem2}
                  />
                  <PointerInput
                    label="Sem 3"
                    value={sem3}
                    onChange={setSem3}
                  />
                  <PointerInput
                    label="Sem 4"
                    value={sem4}
                    onChange={setSem4}
                  />
                </div>

                <button
                  onClick={calculateAverage}
                  className="w-full glass-input flex items-center justify-center gap-2 py-3 text-ai-teal hover:bg-white/10 transition-all"
                >
                  <Calculator className="w-4 h-4" />
                  Calculate Average for Me
                </button>

                {animatedAverage > 0 && (
                  <div className="text-center py-4 animate-fade-up">
                    <p className="text-muted-foreground text-sm mb-1">Your Average</p>
                    <p className="text-4xl font-display font-bold text-gradient">
                      {animatedAverage.toFixed(2)}
                    </p>
                  </div>
                )}

                {average !== null && (
                  <button
                    onClick={handlePerformanceContinue}
                    className="btn-gradient w-full py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </StepContainer>
          )}

          {/* Step: Goal */}
          {step === "goal" && (
            <StepContainer title="What do you want to score this semester?">
              <div className="space-y-4">
                {suggestion && (
                  <div className="glass-input p-4 text-center animate-fade-up">
                    <Sparkles className="w-5 h-5 text-ai-amber mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {suggestion.text.split(suggestion.highlight).map((part, i, arr) => (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && (
                            <span className="text-ai-teal font-bold">{suggestion.highlight}</span>
                          )}
                        </span>
                      ))}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => handleGoalSelect(goal)}
                      className={cn(
                        "glass-input py-3 text-center transition-all hover:scale-105",
                        selectedGoal === goal
                          ? "border-ai-teal bg-ai-teal/20 text-ai-teal"
                          : "hover:bg-white/10"
                      )}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            </StepContainer>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="text-center py-12 space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-ai-blue/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-ai-purple/40 animate-ping" style={{ animationDelay: "0.2s" }} />
                <div className="absolute inset-4 rounded-full border-2 border-ai-teal/50 animate-ping" style={{ animationDelay: "0.4s" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-ai-amber animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-display font-semibold text-gradient">
                  Personalising content according to you…
                </h2>
                <p className="text-sm text-muted-foreground">
                  Our AI is crafting your unique study path
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Progress indicator */}
        {step !== "processing" && (
          <div className="flex justify-center gap-2 mt-8">
            {["degree", "year", "semester", "performance", "goal"].map((s, i) => (
              <div
                key={s}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  step === s
                    ? "bg-ai-teal w-6"
                    : ["degree", "year", "semester", "performance", "goal"].indexOf(step) > i
                    ? "bg-ai-teal/60"
                    : "bg-white/20"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StepContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-6">
    <h2 className="text-xl md:text-2xl font-display font-semibold text-center text-foreground">
      {title}
    </h2>
    {children}
  </div>
);

const OptionButton = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "glass-input py-4 px-4 text-center transition-all duration-200 hover:scale-105",
      selected
        ? "border-ai-teal bg-ai-teal/20 text-ai-teal"
        : "hover:bg-white/10"
    )}
  >
    {label}
  </button>
);

const PointerInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="space-y-1">
    <label className="text-xs text-muted-foreground text-center block">{label}</label>
    <input
      type="number"
      step="0.01"
      min="0"
      max="10"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="glass-input w-full py-3 text-center text-lg font-semibold"
      placeholder="0.00"
    />
  </div>
);

export default Onboarding;

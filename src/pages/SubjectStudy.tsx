import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink, FileText, Video, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { toast } from "sonner";

const AIM_LABELS: Record<string, { title: string; range: string }> = {
    passing: { title: "Passing", range: "≈ 6.0 CGPA" },
    "below-average": { title: "Below Average", range: "6.5 – 7.0" },
    average: { title: "Average", range: "7.0 – 7.5" },
    "above-average": { title: "Above Average", range: "7.5 – 8.5" },
    topper: { title: "Topper", range: "9.0+" },
};

const SubjectStudy = () => {
    const { subjectName } = useParams<{ subjectName: string }>();
    const navigate = useNavigate();
    const { currentUser, userData } = useAuth();
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState<string>("");
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [aimProfile, setAimProfile] = useState<any>(null);
    const [subjectData, setSubjectData] = useState<any>(null);
    const [topicsState, setTopicsState] = useState<any[]>([]);

    useEffect(() => {
        if (!currentUser) {
            navigate("/");
            return;
        }

        const loadData = async () => {
            try {
                // Load user's AIM profile
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.academicProfile) {
                        setAimProfile(data.academicProfile);
                    }

                    // Try to find subject in dashboard state
                    if (data.dashboardState?.subjects) {
                        const subject = data.dashboardState.subjects.find(
                            (s: any) => s.name === decodeURIComponent(subjectName || "")
                        );
                        if (subject) {
                            setSubjectData(subject);
                            setTopicsState(subject.topics || []);
                        }
                    }

                    // Load topic completion status from Firestore
                    if (currentUser && subjectData) {
                        try {
                            const progressCollection = collection(db, "users", currentUser.uid, "progress");
                            const progressSnapshot = await getDocs(progressCollection);

                            const updatedTopics = (subjectData.topics || []).map((topic: any) => {
                                const progressDoc = progressSnapshot.docs.find(
                                    (doc) => doc.data().subjectId === subjectData.id && doc.data().topicId === topic.id
                                );
                                return {
                                    ...topic,
                                    completed: progressDoc?.data().completed || false,
                                };
                            });
                            setTopicsState(updatedTopics);
                        } catch (progressError) {
                            console.warn("Failed to load progress:", progressError);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Failed to load subject data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser, subjectName, navigate]);

    useEffect(() => {
        if (aimProfile && subjectName && !aiSummary && !generatingSummary) {
            generateAISummary();
        }
    }, [aimProfile, subjectName]);

    const generateAISummary = async () => {
        if (!aimProfile || !subjectName) return;

        setGeneratingSummary(true);
        try {
            const topics = subjectData?.topics?.map((t: any) => t.title) || ["General concepts"];
            const aimInfo = AIM_LABELS[aimProfile.aim] || { title: aimProfile.aim, range: "" };

            // Check cache first
            const user = auth.currentUser;
            if (user) {
                try {
                    const cacheRef = doc(db, "users", user.uid, "subjectSummaries", `${subjectName}_${aimProfile.aim}`);
                    const cached = await getDoc(cacheRef);

                    if (cached.exists()) {
                        const cacheData = cached.data();
                        const expiresAt = cacheData.expiresAt?.toDate();
                        if (expiresAt && expiresAt > new Date()) {
                            setAiSummary(cacheData.content);
                            setGeneratingSummary(false);
                            return;
                        }
                    }
                } catch (cacheError) {
                    console.warn("Cache check failed, generating fresh:", cacheError);
                }
            }

            const prompt = `Create a comprehensive study summary for a university student.

Subject: ${decodeURIComponent(subjectName)}
Topics: ${topics.join(", ")}
Student Goal: ${aimInfo.title} (${aimInfo.range} CGPA)

Requirements:
- Write 700-800 words
- Focus on concepts relevant to achieving ${aimInfo.title} level performance
- Include key topics: ${topics.join(", ")}
- Provide actionable study guidance
- Use clear, academic but accessible language
- Structure with clear sections
- For ${aimInfo.title} students: ${aimInfo.title === "Topper" ? "Focus on advanced concepts, proofs, and complex problem-solving" : aimInfo.title === "Above Average" ? "Focus on deeper understanding and consistent practice" : "Focus on core concepts and exam preparation"}

Format the response as a well-structured study guide with sections and bullet points where appropriate.`;

            const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyB9r7oNZQYPCgLoXgjdo5TWUrRARQKYdow";
            // Try gemini-pro first (more stable), fallback to gemini-1.5-flash
            const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

            const response = await fetch(GEMINI_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Gemini API Error:", response.status, errorText);

                // Try to parse error details
                let errorDetails = response.statusText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorDetails = errorJson.error?.message || errorText;
                } catch {
                    errorDetails = errorText || response.statusText;
                }

                // Provide helpful error messages
                if (response.status === 404) {
                    throw new Error(`API endpoint not found. Please check API configuration. (Status: ${response.status})`);
                } else if (response.status === 400) {
                    throw new Error(`Invalid request. Please check API key and parameters. (Status: ${response.status})`);
                } else if (response.status === 403) {
                    throw new Error(`API key invalid or quota exceeded. Please check API key. (Status: ${response.status})`);
                } else {
                    throw new Error(`API error: ${response.status} - ${errorDetails}`);
                }
            }

            const data = await response.json();

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error("Invalid API response structure");
            }

            const textContent = data.candidates[0].content.parts[0].text;
            setAiSummary(textContent);

            // Cache the result
            if (user) {
                try {
                    const cacheRef = doc(db, "users", user.uid, "subjectSummaries", `${subjectName}_${aimProfile.aim}`);
                    await setDoc(cacheRef, {
                        content: textContent,
                        subject: subjectName,
                        aimLevel: aimProfile.aim,
                        generatedAt: new Date(),
                        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                    }, { merge: true });
                } catch (cacheError) {
                    console.warn("Failed to cache summary:", cacheError);
                }
            }
        } catch (error: any) {
            console.error("Error generating AI summary:", error);
            const errorMessage = error.message || "Failed to generate AI summary";
            toast.error("Failed to generate AI summary", {
                description: errorMessage,
            });
            setAiSummary(`AI summary generation encountered an error: ${errorMessage}. Please try again later or contact support.`);
        } finally {
            setGeneratingSummary(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const decodedSubjectName = decodeURIComponent(subjectName || "");
    const topics = topicsState.length > 0 ? topicsState : (subjectData?.topics || []);
    const completedTopics = topics.filter((t: any) => t.completed).length;
    const totalTopics = topics.length;
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Generic Resource URL generator
    const getResourceUrl = (subjectName: string, topicTitle: string, resourceType: string): string => {
        const encodedSubject = encodeURIComponent(subjectName);
        const encodedTopic = encodeURIComponent(topicTitle);

        // Specific Overrides (if any)
        const resourceMap: Record<string, Record<string, Record<string, string>>> = {
            "Microprocessor and Microcontroller": {
                // Keep existing specific ones if valuable, or rely on generics
            }
        };
        const specific = resourceMap[subjectName]?.[topicTitle]?.[resourceType];
        if (specific) return specific;

        // Generic Fallbacks
        if (resourceType === "Concept Notes") {
            // Link to a search in Drive or a specific folder if known.
            // Using a placeholder Folder Search for now as requested by user plan
            return `https://drive.google.com/drive/search?q=${encodedSubject}%20${encodedTopic}`;
        }
        if (resourceType === "Video Tutorial") {
            return `https://www.youtube.com/results?search_query=${encodedSubject}+${encodedTopic}+tutorial`;
        }
        if (resourceType === "Practice Problems") {
            return `https://www.google.com/search?q=${encodedSubject}+${encodedTopic}+practice+problems+geeksforgeeks`;
        }
        return "#";
    };

    const handleTopicToggle = async (topicId: string, currentCompleted: boolean) => {
        if (!currentUser || !subjectData) return;

        const newCompleted = !currentCompleted;

        // Update local state immediately
        setTopicsState((prev) =>
            prev.map((t: any) =>
                t.id === topicId ? { ...t, completed: newCompleted } : t
            )
        );

        // Sync to Firestore
        try {
            await setDoc(
                doc(db, "users", currentUser.uid, "progress", `${subjectData.id}_${topicId}`),
                {
                    subjectId: subjectData.id,
                    topicId,
                    completed: newCompleted,
                    updatedAt: new Date(),
                },
                { merge: true }
            );
            toast.success(newCompleted ? "Topic marked as completed" : "Topic marked as incomplete");
        } catch (error) {
            console.error("Error updating topic:", error);
            toast.error("Failed to update topic status");
            // Revert local state on error
            setTopicsState((prev) =>
                prev.map((t: any) =>
                    t.id === topicId ? { ...t, completed: currentCompleted } : t
                )
            );
        }
    };

    const handleResourceClick = (resourceType: string, topicTitle: string) => {
        const url = getResourceUrl(decodedSubjectName, topicTitle, resourceType);
        if (url && url !== "#") {
            window.open(url, "_blank", "noopener,noreferrer");
            toast.success(`Opening ${resourceType}`, {
                description: `Opening resources for "${topicTitle}"`,
            });
        } else {
            toast.error("Resource not available");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-display font-bold">{decodedSubjectName}</h1>
                        <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                                {completedTopics}/{totalTopics} topics completed
                            </Badge>
                            <Progress value={progressPercent} className="w-32" />
                            <span className="text-sm text-muted-foreground">{progressPercent}%</span>
                        </div>
                    </div>
                </div>

                {/* AI Summary Section */}
                <Card className="mb-6 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-primary">
                            <BookOpen className="h-5 w-5" />
                            AI Study Summary
                            {aimProfile && (
                                <Badge variant="secondary" className="ml-2 bg-background/50">
                                    Goal: {AIM_LABELS[aimProfile.aim]?.title || aimProfile.aim}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            Personalized study guide generated based on your academic goal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {generatingSummary ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                                    <p className="text-muted-foreground">Generating AI summary...</p>
                                </div>
                            </div>
                        ) : aiSummary ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                                    {aiSummary}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">Click below to get a tailored study strategy.</p>
                                <Button onClick={generateAISummary}>Generate Summary</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Topics Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Topics ({totalTopics} total)
                        </CardTitle>
                        <CardDescription>Access study materials for each unit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topics.length > 0 ? (
                            <div className="space-y-4">
                                {topics.map((topic: any, index: number) => (
                                    <div
                                        key={topic.id || index}
                                        className="p-4 border rounded-lg hover:bg-muted/30 transition-shadow hover:shadow-sm bg-card"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={topic.completed || false}
                                                    onChange={(e) => handleTopicToggle(topic.id, topic.completed)}
                                                    className="mt-1 w-5 h-5 accent-green-500 cursor-pointer"
                                                />
                                                <h3 className="font-semibold text-lg">{topic.title}</h3>
                                            </div>
                                            {topic.completed && (
                                                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                                    Completed
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="ml-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {(() => {
                                                const notesUrl = getResourceUrl(decodedSubjectName, topic.title, "Concept Notes");
                                                const videoUrl = getResourceUrl(decodedSubjectName, topic.title, "Video Tutorial");
                                                const practiceUrl = getResourceUrl(decodedSubjectName, topic.title, "Practice Problems");

                                                return (
                                                    <>
                                                        <button
                                                            onClick={() => handleResourceClick("Concept Notes", topic.title)}
                                                            className="flex items-center justify-between p-3 rounded-lg border bg-blue-50/50 hover:bg-blue-100/50 border-blue-200 text-blue-700 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <FileText className="h-4 w-4" />
                                                                <span className="font-medium text-sm">Notes</span>
                                                            </div>
                                                            <Badge variant="outline" className="bg-white/50 text-[10px] group-hover:bg-blue-500 group-hover:text-white transition-colors border-blue-200">
                                                                Available
                                                            </Badge>
                                                        </button>

                                                        <button
                                                            onClick={() => handleResourceClick("Video Tutorial", topic.title)}
                                                            className="flex items-center justify-between p-3 rounded-lg border bg-red-50/50 hover:bg-red-100/50 border-red-200 text-red-700 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Video className="h-4 w-4" />
                                                                <span className="font-medium text-sm">Video</span>
                                                            </div>
                                                            <Badge variant="outline" className="bg-white/50 text-[10px] group-hover:bg-red-500 group-hover:text-white transition-colors border-red-200">
                                                                Watch
                                                            </Badge>
                                                        </button>

                                                        <button
                                                            onClick={() => handleResourceClick("Practice Problems", topic.title)}
                                                            className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50 hover:bg-green-100/50 border-green-200 text-green-700 transition-all group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <ExternalLink className="h-4 w-4" />
                                                                <span className="font-medium text-sm">Practice</span>
                                                            </div>
                                                            <Badge variant="outline" className="bg-white/50 text-[10px] group-hover:bg-green-500 group-hover:text-white transition-colors border-green-200">
                                                                Solve
                                                            </Badge>
                                                        </button>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No topics available for this subject yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex gap-4 mt-6">
                    <Button
                        onClick={() => {
                            const topics = subjectData?.topics?.map((t: any) => t.title) || [];
                            navigate(`/dashboard`);
                            // Trigger quiz modal from dashboard
                            setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('openQuiz', {
                                    detail: { subjectId: subjectData?.id, subjectName: decodedSubjectName, topics }
                                }));
                            }, 100);
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-500/20"
                    >
                        📝 Start Quiz
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                        className="flex-1"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SubjectStudy;


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, FileText, Download, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";

interface Subject {
    id: string;
    name: string;
    topics: string[];
}

const StudyMaterials = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSubjects = async () => {
            if (!currentUser) {
                navigate("/");
                return;
            }

            try {
                // Load user's subjects from their academicProfile
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    // Check for academicProfile first (from landing page)
                    if (userData.academicProfile?.subjects && Array.isArray(userData.academicProfile.subjects)) {
                        const { mapSubjectsToData } = await import("@/lib/subjectMapper");
                        const userSubjects = mapSubjectsToData(userData.academicProfile.subjects);
                        setSubjects(userSubjects);
                        if (userSubjects.length > 0) {
                            setSelectedSubject(userSubjects[0].id);
                        }
                    }
                    // Fallback to dashboardState
                    else if (userData.dashboardState?.subjects) {
                        const userSubjects = userData.dashboardState.subjects.map((s: any) => ({
                            id: s.id,
                            name: s.name,
                            topics: s.topics.map((t: any) => t.title),
                        }));
                        setSubjects(userSubjects);
                        if (userSubjects.length > 0) {
                            setSelectedSubject(userSubjects[0].id);
                        }
                    }
                    // If no subjects found, show message
                    else {
                        setSubjects([]);
                        toast.info("No subjects found", {
                            description: "Please complete your goal setup on the landing page first.",
                        });
                    }
                } else {
                    setSubjects([]);
                    toast.info("Profile not found", {
                        description: "Please complete your goal setup on the landing page first.",
                    });
                }
            } catch (error) {
                console.error("Error loading subjects:", error);
                toast.error("Failed to load subjects");
            } finally {
                setLoading(false);
            }
        };

        loadSubjects();
    }, [currentUser, navigate]);

    const currentSubject = subjects.find((s) => s.id === selectedSubject);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/dashboard")}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-display font-bold">Study Materials</h1>
                        <p className="text-muted-foreground mt-1">
                            Access study resources and materials for your subjects
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Loading subjects...</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Subject List Sidebar */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Subjects</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {subjects.map((subject) => (
                                            <button
                                                key={subject.id}
                                                onClick={() => setSelectedSubject(subject.id)}
                                                className={`w-full text-left p-3 rounded-lg transition-colors ${selectedSubject === subject.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                                    }`}
                                            >
                                                <div className="font-medium">{subject.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Materials Content */}
                        <div className="lg:col-span-3">
                            {currentSubject ? (
                                <Tabs defaultValue="resources" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="resources">Resources</TabsTrigger>
                                        <TabsTrigger value="notes">AI Notes</TabsTrigger>
                                        <TabsTrigger value="links">External Links</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="resources" className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    Study Resources
                                                </CardTitle>
                                                <CardDescription>
                                                    Materials for {currentSubject.name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {currentSubject.topics.length > 0 ? (
                                                        currentSubject.topics.map((topic, index) => {
                                                            const encodedSubject = encodeURIComponent(currentSubject.name);
                                                            const encodedTopic = encodeURIComponent(topic);
                                                            // Generic Links
                                                            const notesUrl = `https://drive.google.com/drive/search?q=${encodedSubject}%20${encodedTopic}`;
                                                            const videoUrl = `https://www.youtube.com/results?search_query=${encodedSubject}+${encodedTopic}+tutorial`;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                                                >
                                                                    <div className="flex flex-col gap-3">
                                                                        <div className="flex justify-between items-center">
                                                                            <h3 className="font-semibold">{topic}</h3>
                                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>
                                                                        </div>

                                                                        <div className="flex gap-2 mt-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                                                                onClick={() => window.open(notesUrl, "_blank", "noopener,noreferrer")}
                                                                            >
                                                                                <FileText className="h-4 w-4" />
                                                                                Notes
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                                                                                onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
                                                                            >
                                                                                <ExternalLink className="h-4 w-4" />
                                                                                Video
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    ) : (
                                                        <div className="text-center py-12">
                                                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                            <p className="text-muted-foreground">
                                                                No topics available for this subject yet.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="notes" className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <BookOpen className="h-5 w-5" />
                                                    AI-Generated Study Notes
                                                </CardTitle>
                                                <CardDescription>
                                                    AI-powered study notes for {currentSubject.name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="p-6 border rounded-lg bg-muted/30 text-center">
                                                    <p className="text-muted-foreground mb-4">
                                                        To generate personalized AI notes and summaries, please visit the detailed Subject Study page.
                                                    </p>
                                                    <Button onClick={() => navigate(`/subject/${encodeURIComponent(currentSubject.name)}`)}>
                                                        Go to Subject Page
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="links" className="mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <ExternalLink className="h-5 w-5" />
                                                    External Resources
                                                </CardTitle>
                                                <CardDescription>
                                                    Useful links and references for {currentSubject.name}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="p-4 border rounded-lg">
                                                        <h3 className="font-semibold mb-2">General Resources</h3>
                                                        <div className="flex flex-col gap-2">
                                                            <a href={`https://www.google.com/search?q=${encodeURIComponent(currentSubject.name)}+study+guide`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                                                <ExternalLink className="h-3 w-3" />
                                                                Google Search: {currentSubject.name} Study Guides
                                                            </a>
                                                            <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(currentSubject.name)}+course`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                                                <ExternalLink className="h-3 w-3" />
                                                                YouTube: {currentSubject.name} Courses
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <p className="text-muted-foreground">Select a subject to view materials</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyMaterials;

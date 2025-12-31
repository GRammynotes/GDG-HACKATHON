import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    Map,
    BookOpen,
    LogOut,
    UserCircle
} from "lucide-react";

export default function Navbar() {
    const { logout, userData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                    <Link to="/landing" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block">
                            AI-nstein CREW
                        </span>
                    </Link>
                    <div className="flex items-center space-x-4 text-sm font-medium">
                        <Link
                            to="/landing"
                            className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive("/landing") ? "text-foreground" : "text-foreground/60"}`}
                        >
                            <Map className="h-4 w-4" />
                            Roadmap
                        </Link>
                        <Link
                            to="/dashboard"
                            className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive("/dashboard") ? "text-foreground" : "text-foreground/60"}`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Link
                            to="/materials"
                            className={`flex items-center gap-2 transition-colors hover:text-foreground/80 ${isActive("/materials") ? "text-foreground" : "text-foreground/60"}`}
                        >
                            <BookOpen className="h-4 w-4" />
                            Materials
                        </Link>
                    </div>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                        <UserCircle className="h-4 w-4" />
                        <span className="hidden sm:inline-block">
                            {userData?.fullName?.split(' ')[0] || "Scholar"}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-red-500 hover:text-red-600"
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}

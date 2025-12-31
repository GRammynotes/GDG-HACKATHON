import { ReactNode } from "react";
import Navbar from "./Navbar";

export default function MainLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-background relative">
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}

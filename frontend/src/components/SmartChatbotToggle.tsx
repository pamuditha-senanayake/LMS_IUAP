"use client";

import { MessageCircle, X } from "lucide-react";

interface SmartChatbotToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function SmartChatbotToggle({ isOpen, onToggle }: SmartChatbotToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg z-50 ${
                isOpen
                    ? "bg-white hover:bg-slate-50 border border-slate-200"
                    : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            } shadow-indigo-500/25 hover:shadow-indigo-500/40`}
        >
            {isOpen ? (
                <X className="w-6 h-6 text-slate-600" />
            ) : (
                <MessageCircle className="w-6 h-6 text-white" />
            )}
        </button>
    );
}
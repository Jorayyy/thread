"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./chat-window";
import { MessageSquare, X, Minus } from "lucide-react";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  const toggleChat = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && !isMinimized && (
        <div className="mb-4 w-[380px] h-[520px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <ChatWindow onClose={closeChat} onMinimize={() => setIsMinimized(true)} />
        </div>
      )}

      {isOpen && isMinimized && (
        <div className="mb-4 w-[380px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="flex items-center justify-between p-3 bg-primary text-primary-foreground">
            <span className="font-medium text-sm">ThreadCraft Support</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary/90"
                onClick={() => setIsMinimized(false)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-primary-foreground hover:bg-primary/90"
                onClick={closeChat}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        ref={buttonRef}
        onClick={toggleChat}
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 relative"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
    </div>
  );
}

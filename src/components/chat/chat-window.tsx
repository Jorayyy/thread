"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, Minus, User, Bot, Loader2, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

interface ChatWindowProps {
  onClose: () => void;
  onMinimize: () => void;
}

export function ChatWindow({ onClose, onMinimize }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [mode, setMode] = useState<"bot" | "human" | "closed">("bot");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connected");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: "welcome",
      role: "assistant",
      content: "Hi! Welcome to ThreadCraft. I'm here to help you with questions about our clothing products, sizing, shipping, returns, and more. How can I assist you today?",
      createdAt: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      if (data.mode) {
        setMode(data.mode);
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.content,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: "Sorry, I encountered an error. Please try again or contact support.",
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHumanAgent = async () => {
    if (!conversationId) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "I would like to speak with a human agent please." }],
            conversationId: null,
            requestHuman: true,
          }),
        });

        if (!response.ok) throw new Error("Failed to request human agent");

        const data = await response.json();
        setConversationId(data.conversationId);
        setMode("human");

        const systemMessage: Message = {
          id: `system-${Date.now()}`,
          role: "system",
          content: "A human agent will be with you shortly. Our store hours are 9AM-6PM PHT, Monday-Saturday.",
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      } catch (error) {
        console.error("Error requesting human agent:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [],
            conversationId,
            requestHuman: true,
          }),
        });

        if (response.ok) {
          setMode("human");
          const systemMessage: Message = {
            id: `system-${Date.now()}`,
            role: "system",
            content: "A human agent will be with you shortly. Our store hours are 9AM-6PM PHT, Monday-Saturday.",
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
      } catch (error) {
        console.error("Error requesting human agent:", error);
      }
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">ThreadCraft Support</h3>
            <div className="flex items-center gap-1 text-xs opacity-90">
              <div className={cn(
                "h-2 w-2 rounded-full",
                connectionStatus === "connected" ? "bg-green-400" : 
                connectionStatus === "connecting" ? "bg-yellow-400" : "bg-red-400"
              )} />
              <span>
                {mode === "human" ? "Human Agent" : 
                 connectionStatus === "connected" ? "AI Assistant" : 
                 connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary/90"
            onClick={onMinimize}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary/90"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role !== "user" && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {message.role === "system" ? (
                  <Phone className="h-4 w-4 text-primary" />
                ) : (
                  <Bot className="h-4 w-4 text-primary" />
                )}
              </div>
            )}
            <div
              className={cn(
                "max-w-[75%] rounded-lg px-4 py-2 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.role === "system"
                  ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  : "bg-white text-gray-900 border border-gray-200"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className={cn(
                "text-xs mt-1 opacity-70",
                message.role === "user" ? "text-right" : "text-left"
              )}>
                {formatTime(message.createdAt)}
              </p>
            </div>
            {message.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-white text-gray-900 border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Request Human Button */}
      {mode === "bot" && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-sm"
            onClick={requestHumanAgent}
            disabled={isLoading}
          >
            <Phone className="h-4 w-4 mr-2" />
            Chat with a Human Agent
          </Button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "human" ? "Type your message..." : "Ask about our products..."}
            disabled={isLoading || mode === "closed"}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading || mode === "closed"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

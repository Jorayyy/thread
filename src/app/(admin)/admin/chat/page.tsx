"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getConversations,
  getMessages,
  switchToHumanMode,
  sendHumanMessage,
  closeConversation,
} from "@/app/actions/chat";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  User,
  Bot,
  Loader2,
  Send,
  Phone,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Conversation {
  id: number;
  userId: number | null;
  sessionId: string | null;
  mode: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  metadata: any;
  createdAt: Date | null;
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const data = await getConversations();
      setConversations(data as Conversation[]);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const data = await getMessages(conversationId);
      setMessages(data as Message[]);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleTakeover = async (conversationId: number) => {
    try {
      await switchToHumanMode(conversationId);
      await loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({
          ...selectedConversation,
          mode: "human",
        });
      }
    } catch (error) {
      console.error("Failed to take over conversation:", error);
    }
  };

  const handleClose = async (conversationId: number) => {
    try {
      await closeConversation(conversationId);
      await loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({
          ...selectedConversation,
          mode: "closed",
          status: "closed",
        });
      }
    } catch (error) {
      console.error("Failed to close conversation:", error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      await sendHumanMessage(selectedConversation.id, input.trim());
      setInput("");
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (mode: string, status: string) => {
    if (status === "closed") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
          <X className="h-3 w-3" />
          Closed
        </span>
      );
    }
    if (mode === "human") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <Phone className="h-3 w-3" />
          Human
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
        <Bot className="h-3 w-3" />
        Bot
      </span>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chat Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage customer conversations and provide support
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversations</span>
                <Button variant="outline" size="sm" onClick={loadConversations}>
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedConversation?.id === conv.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Conversation #{conv.id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(conv.updatedAt)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(conv.mode, conv.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Conversation #{selectedConversation.id}</span>
                    {getStatusBadge(selectedConversation.mode, selectedConversation.status)}
                  </CardTitle>
                  <div className="flex gap-2">
                    {selectedConversation.mode === "bot" &&
                      selectedConversation.status !== "closed" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleTakeover(selectedConversation.id)}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Take Over
                        </Button>
                      )}
                    {selectedConversation.status !== "closed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClose(selectedConversation.id)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-start" : "justify-end"
                    )}
                  >
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                        message.role === "user"
                          ? "bg-muted text-foreground"
                          : message.metadata?.isHuman
                          ? "bg-green-100 text-green-900 border border-green-200"
                          : message.role === "system"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {message.metadata?.isHuman && (
                        <p className="text-xs font-medium mb-1 text-green-600">
                          Human Agent ({message.metadata.agentName})
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                    {message.role !== "user" && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        {message.metadata?.isHuman ? (
                          <Phone className="h-4 w-4 text-primary-foreground" />
                        ) : message.role === "system" ? (
                          <Clock className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {selectedConversation.mode === "human" &&
                selectedConversation.status !== "closed" && (
                  <div className="p-4 border-t">
                    <form onSubmit={handleSend} className="flex gap-2">
                      <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your response..."
                        disabled={isSending}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={!input.trim() || isSending}
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                )}
            </Card>
          ) : (
            <Card className="h-[700px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium">Select a conversation</h3>
                <p className="text-sm">
                  Choose a conversation from the list to view messages
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

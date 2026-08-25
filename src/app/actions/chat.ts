"use server";

import { db } from "@/db";
import { conversations, messages, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/auth";

export async function getConversations() {
  const session = await auth();
  
  const result = await db
    .select({
      id: conversations.id,
      userId: conversations.userId,
      sessionId: conversations.sessionId,
      mode: conversations.mode,
      status: conversations.status,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .orderBy(desc(conversations.updatedAt));

  return result;
}

export async function getMessages(conversationId: number) {
  const result = await db
    .select({
      id: messages.id,
      conversationId: messages.conversationId,
      role: messages.role,
      content: messages.content,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return result;
}

export async function createConversation(sessionId?: string) {
  const session = await auth();
  
  const [conversation] = await db
    .insert(conversations)
    .values({
      userId: session?.user?.id ? parseInt(session.user.id) : undefined,
      sessionId: sessionId || undefined,
      mode: "bot",
      status: "active",
    })
    .returning({ id: conversations.id });

  return conversation;
}

export async function switchToHumanMode(conversationId: number) {
  const session = await auth();
  
  const [updated] = await db
    .update(conversations)
    .set({
      mode: "human",
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId))
    .returning({ id: conversations.id });

  if (updated) {
    await db.insert(messages).values({
      conversationId,
      role: "system",
      content: "This conversation has been switched to a human agent.",
    });
  }

  return updated;
}

export async function sendHumanMessage(conversationId: number, content: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [message] = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content,
      metadata: {
        agentId: session.user.id,
        agentName: session.user.name,
        isHuman: true,
      },
    })
    .returning({ id: messages.id });

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return message;
}

export async function closeConversation(conversationId: number) {
  const [updated] = await db
    .update(conversations)
    .set({
      mode: "closed",
      status: "closed",
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId))
    .returning({ id: conversations.id });

  if (updated) {
    await db.insert(messages).values({
      conversationId,
      role: "system",
      content: "This conversation has been closed.",
    });
  }

  return updated;
}

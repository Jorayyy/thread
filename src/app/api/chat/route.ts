import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

const systemPrompt = `You are ThreadCraft's AI assistant. You help customers with questions about our clothing products. You can answer questions about sizing, materials, shipping, returns, and product availability. Be friendly and helpful. If you don't know the answer, suggest they speak with a human agent. Our store hours are 9AM-6PM PHT, Monday-Saturday.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages: chatMessages, conversationId, requestHuman } = body;

    if (requestHuman) {
      if (conversationId) {
        await db
          .update(conversations)
          .set({ mode: "human", updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
      } else {
        const [newConversation] = await db
          .insert(conversations)
          .values({ mode: "human", status: "active" })
          .returning({ id: conversations.id });

        return NextResponse.json({
          conversationId: newConversation.id,
          mode: "human",
          content: "I've connected you with a human agent. They'll be with you shortly.",
        });
      }

      return NextResponse.json({
        conversationId,
        mode: "human",
        content: "I've connected you with a human agent. They'll be with you shortly.",
      });
    }

    if (conversationId) {
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (conversation?.mode === "human") {
        const lastUserMessage = chatMessages
          .filter((m: { role: string }) => m.role === "user")
          .pop();

        if (lastUserMessage) {
          await db.insert(messages).values({
            conversationId,
            role: "user",
            content: lastUserMessage.content,
          });
        }

        return NextResponse.json({
          conversationId,
          mode: "human",
          content: "Your message has been sent to our human agent. Please wait for their response.",
        });
      }
    }

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const [newConversation] = await db
        .insert(conversations)
        .values({ mode: "bot", status: "active" })
        .returning({ id: conversations.id });

      activeConversationId = newConversation.id;
    }

    const userMessages = chatMessages.filter((m: { role: string }) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (lastUserMessage) {
      await db.insert(messages).values({
        conversationId: activeConversationId,
        role: "user",
        content: lastUserMessage.content,
      });
    }

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: chatMessages,
      onFinish: async (completion) => {
        await db.insert(messages).values({
          conversationId: activeConversationId,
          role: "assistant",
          content: completion.text,
        });

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, activeConversationId));
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

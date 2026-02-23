import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getModelCost } from "./models";

// @note send a user message — creates conversation if needed, pre-checks credits
export const sendMessage = mutation({
  args: {
    workosId: v.string(),
    conversationId: v.optional(v.id("conversations")),
    content: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      throw new Error("user not found");
    }

    // @note pre-check only — actual deduction happens in backend api after model response
    const cost = getModelCost(args.model);

    if (user.credits < cost) {
      throw new Error("insufficient credits");
    }

    const now = Date.now();

    // @note create conversation on first message
    let conversationId = args.conversationId;
    if (!conversationId) {
      const title =
        args.content.length > 50
          ? args.content.slice(0, 50) + "..."
          : args.content;

      conversationId = await ctx.db.insert("conversations", {
        userId: user._id,
        title,
        model: args.model,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.patch(conversationId, { updatedAt: now });
    }

    // @note save user message
    const messageId = await ctx.db.insert("messages", {
      conversationId,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    return { conversationId, messageId };
  },
});

// @note edit latest user message and remove newer messages in conversation
export const editLatestUserMessage = mutation({
  args: {
    workosId: v.string(),
    conversationId: v.id("conversations"),
    content: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      throw new Error("user not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("conversation not found");
    }

    const cost = getModelCost(args.model);
    if (user.credits < cost) {
      throw new Error("insufficient credits");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    let latestUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") {
        latestUserIndex = i;
        break;
      }
    }

    if (latestUserIndex === -1) {
      throw new Error("no user message to edit");
    }

    for (let i = latestUserIndex; i < messages.length; i += 1) {
      await ctx.db.delete(messages[i]._id);
    }

    const now = Date.now();
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, {
      model: args.model,
      updatedAt: now,
    });

    return { conversationId: args.conversationId, messageId };
  },
});

// @note save assistant response after streaming completes
export const saveAssistantMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      model: args.model,
      createdAt: now,
    });

    await ctx.db.patch(args.conversationId, { updatedAt: now });

    // @note return message count so http action can decide whether to generate a title
    const messageCount = (
      await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) =>
          q.eq("conversationId", args.conversationId),
        )
        .collect()
    ).length;

    return { messageCount };
  },
});

// @note update a conversation's title (used by auto-title generation)
export const updateTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

// @note get all messages for a conversation
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
  },
});

// @note get conversations for a user (most recent first)
export const getConversations = query({
  args: { workosId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// @note delete a conversation and all its messages
export const deleteConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
    workosId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return;

    // @note verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user || conversation.userId !== user._id) {
      throw new Error("unauthorized");
    }

    // @note delete all messages in the conversation
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.conversationId);
  },
});

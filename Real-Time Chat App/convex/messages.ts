import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { channelId: v.id("channels") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(50);

    // Get user info for each message
    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.author);
        return {
          ...message,
          authorName: user?.name || user?.email || "Unknown User",
        };
      })
    );

    return messagesWithUsers.reverse();
  },
});

export const send = mutation({
  args: {
    content: v.string(),
    channelId: v.id("channels"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.content.trim() === "") {
      throw new Error("Message cannot be empty");
    }

    await ctx.db.insert("messages", {
      content: args.content,
      author: userId,
      channelId: args.channelId,
    });
  },
});

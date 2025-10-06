import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.query("channels").collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    if (args.name.trim() === "") {
      throw new Error("Channel name cannot be empty");
    }

    // Check if channel already exists
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      throw new Error("Channel already exists");
    }

    return await ctx.db.insert("channels", {
      name: args.name,
      description: args.description,
      createdBy: userId,
    });
  },
});

export const getDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if general channel exists
    let general = await ctx.db
      .query("channels")
      .withIndex("by_name", (q) => q.eq("name", "general"))
      .first();

    // Create general channel if it doesn't exist
    if (!general) {
      const channelId = await ctx.db.insert("channels", {
        name: "general",
        description: "General discussion",
        createdBy: userId,
      });
      general = await ctx.db.get(channelId);
    }

    return general;
  },
});

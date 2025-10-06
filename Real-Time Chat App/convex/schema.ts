import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  }).index("by_name", ["name"]),

  messages: defineTable({
    content: v.string(),
    author: v.id("users"),
    channelId: v.id("channels"),
  }).index("by_channel", ["channelId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

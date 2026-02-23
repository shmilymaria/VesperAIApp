import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// @note upsert user on login — creates if new, updates profile if existing
export const upsert = mutation({
  args: {
    workosId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    profilePictureUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        profilePictureUrl: args.profilePictureUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    // @note new user starts with "free" role and 2000 credits (20.00%)
    const userId = await ctx.db.insert("users", {
      workosId: args.workosId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      profilePictureUrl: args.profilePictureUrl,
      role: "free",
      credits: 2000,
      createdAt: now,
      updatedAt: now,
    });

    // @note record the initial bonus credit grant
    await ctx.db.insert("creditTransactions", {
      userId,
      amount: 2000,
      type: "bonus",
      description: "Welcome User!",
      createdAt: now,
    });

    return userId;
  },
});

// @note fetch user by workos id — used by the client after login
export const getByWorkosId = query({
  args: { workosId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();
  },
});

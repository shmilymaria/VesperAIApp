import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// @note spend credits — validates balance before deducting
export const spend = mutation({
  args: {
    workosId: v.string(),
    amount: v.number(),
    model: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      throw new Error("user not found");
    }

    if (args.amount <= 0) {
      throw new Error("amount must be positive");
    }

    if (user.credits < args.amount) {
      throw new Error("insufficient credits");
    }

    const now = Date.now();

    await ctx.db.patch(user._id, {
      credits: user.credits - args.amount,
      updatedAt: now,
    });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount: -args.amount,
      type: "usage",
      model: args.model,
      description: args.description,
      createdAt: now,
    });

    return { credits: user.credits - args.amount };
  },
});

// @note add credits — for purchases, bonuses, refunds
export const add = mutation({
  args: {
    workosId: v.string(),
    amount: v.number(),
    type: v.union(
      v.literal("purchase"),
      v.literal("bonus"),
      v.literal("refund"),
    ),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_workos_id", (q) => q.eq("workosId", args.workosId))
      .unique();

    if (!user) {
      throw new Error("user not found");
    }

    if (args.amount <= 0) {
      throw new Error("amount must be positive");
    }

    const now = Date.now();

    await ctx.db.patch(user._id, {
      credits: user.credits + args.amount,
      updatedAt: now,
    });

    await ctx.db.insert("creditTransactions", {
      userId: user._id,
      amount: args.amount,
      type: args.type,
      description: args.description,
      createdAt: now,
    });

    return { credits: user.credits + args.amount };
  },
});

// @note fetch recent credit transactions for a user
export const getHistory = query({
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
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

// @note default monthly credit allowance per role
const MONTHLY_CREDITS: Record<string, number> = {
  free: 2000,
  pro: 5000,
  admin: 100000,
};

// @note reset all users' credits to their role allowance on the 1st of each month
export const resetAllCredits = internalMutation({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();

    for (const user of users) {
      const allowance = MONTHLY_CREDITS[user.role] ?? MONTHLY_CREDITS.free;

      // @note skip if user already has full or more credits
      if (user.credits >= allowance) {
        continue;
      }

      const topUp = allowance - user.credits;

      await ctx.db.patch(user._id, {
        credits: allowance,
        updatedAt: now,
      });

      await ctx.db.insert("creditTransactions", {
        userId: user._id,
        amount: topUp,
        type: "reset",
        description: "monthly credit reset",
        createdAt: now,
      });
    }
  },
});

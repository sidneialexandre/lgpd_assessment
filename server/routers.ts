import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createAssessment, getAssessmentById, getUserAssessments, saveAnswers, getAssessmentAnswers } from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assessment: router({
    create: protectedProcedure.mutation(async ({ ctx }) => {
      return await createAssessment(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentById(input.assessmentId);
      }),

    getUserAssessments: protectedProcedure.query(async ({ ctx }) => {
      return await getUserAssessments(ctx.user.id);
    }),

    saveAnswers: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          answers: z.array(
            z.object({
              questionId: z.number(),
              selectedAnswer: z.string(),
              score: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        await saveAnswers(input.assessmentId, input.answers);
        return await getAssessmentById(input.assessmentId);
      }),

    getAnswers: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentAnswers(input.assessmentId);
      }),
  }),
});

export type AppRouter = typeof appRouter;


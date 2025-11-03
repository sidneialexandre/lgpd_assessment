import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createCompany, 
  getCompanyByCNPJ, 
  getCompanyById,
  getUserCompanies,
  createGroup,
  getCompanyGroups,
  deleteGroup,
  createAssessment, 
  getAssessmentById, 
  getCompanyAssessments,
  createRespondentSession,
  getRespondentSession,
  getRespondentSessionByToken,
  getAssessmentRespondentSessions,
  saveIndividualAnswers,
  getIndividualAnswers,
  checkAllRespondentsCompleted,
  calculateConsolidatedResults,
  getAssessmentAnswers 
} from "./db";

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

  company: router({
    create: protectedProcedure
      .input(
        z.object({
          cnpj: z.string().min(14).max(18),
          razaoSocial: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await createCompany(ctx.user.id, input.cnpj, input.razaoSocial);
      }),

    getByCNPJ: protectedProcedure
      .input(z.object({ cnpj: z.string() }))
      .query(async ({ input }) => {
        return await getCompanyByCNPJ(input.cnpj);
      }),

    getById: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getCompanyById(input.companyId);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCompanies(ctx.user.id);
    }),
  }),

  group: router({
    create: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          groupName: z.string().min(1),
          departmentName: z.string().min(1),
          respondentCount: z.number().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await createGroup(input.companyId, input.groupName, input.departmentName, input.respondentCount);
      }),

    getByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getCompanyGroups(input.companyId);
      }),

    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteGroup(input.groupId);
        return { success: true };
      }),
  }),

  assessment: router({
    create: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input }) => {
        return await createAssessment(input.companyId);
      }),

    getById: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentById(input.assessmentId);
      }),

    getByCompany: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getCompanyAssessments(input.companyId);
      }),

    getAnswers: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentAnswers(input.assessmentId);
      }),

    getWithDetails: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) return null;

        const sessions = await getAssessmentRespondentSessions(input.assessmentId);
        const completedSessions = sessions.filter(s => s.isCompleted === 1);
        const pendingSessions = sessions.filter(s => s.isCompleted === 0);

        return {
          assessment,
          totalRespondents: sessions.length,
          completedRespondents: completedSessions.length,
          pendingRespondents: pendingSessions.length,
          sessions,
          completedSessions,
          pendingSessions,
        };
      }),

    finalize: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input }) => {
        await calculateConsolidatedResults(input.assessmentId);
        return await getAssessmentById(input.assessmentId);
      }),
  }),

  respondent: router({
    createSession: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          groupId: z.number(),
          respondentNumber: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await createRespondentSession(input.assessmentId, input.groupId, input.respondentNumber);
      }),

    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await getRespondentSession(input.sessionId);
      }),

    getAssessmentSessions: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getAssessmentRespondentSessions(input.assessmentId);
      }),

    saveAnswers: protectedProcedure
      .input(
        z.object({
          respondentSessionId: z.number(),
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
        // Save individual answers
        await saveIndividualAnswers(input.respondentSessionId, input.answers);

        // Check if all respondents have completed
        const allCompleted = await checkAllRespondentsCompleted(input.assessmentId);

        if (allCompleted) {
          // Calculate consolidated results
          await calculateConsolidatedResults(input.assessmentId);
        }

        return await getAssessmentById(input.assessmentId);
      }),

    checkCompletion: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        const isCompleted = await checkAllRespondentsCompleted(input.assessmentId);
        const assessment = await getAssessmentById(input.assessmentId);
        return {
          isCompleted,
          assessment,
        };
      }),

    getByToken: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .query(async ({ input }) => {
        return await getRespondentSessionByToken(input.accessToken);
      }),
  }),

});

export type AppRouter = typeof appRouter;


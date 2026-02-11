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
  getLastAssessmentWithGroups,
  createRespondentSession,
  getRespondentSession,
  getAssessmentRespondentSessions,
  getRespondentSessionByToken,
  getCompanyIdByToken,
  saveIndividualAnswers,
  getIndividualAnswers,
  checkAllRespondentsCompleted,
  calculateConsolidatedResults,
  getAssessmentAnswers,
  deleteAssessment,
  deleteCompany,
  getRespondentSessionsByEmail,
  getDb,
  createRespondentSessionsForAssessment,
  createAssessmentGroupsForAssessment,
  createGroupForAssessment
} from "./db";
import { groups } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

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
    createOrGet: protectedProcedure
      .input(
        z.object({
          cnpj: z.string().min(14).max(18),
          razaoSocial: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getCompanyByCNPJ(input.cnpj);
        if (existing) {
          return existing;
        }
        return await createCompany(ctx.user.id, input.cnpj, input.razaoSocial);
      }),

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

    delete: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCompany(input.companyId);
        return { success: true };
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

    getByAssessment: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        const sessions = await getAssessmentRespondentSessions(input.assessmentId);
        const uniqueGroupIds = Array.from(new Set(sessions.map(s => s.groupId)));
        
        if (uniqueGroupIds.length === 0) return [];
        
        const db = await getDb();
        if (!db) return [];
        
        const groupsResult = await db
          .select()
          .from(groups)
          .where(inArray(groups.id, uniqueGroupIds));
        
        return groupsResult;
      }),

    createForAssessment: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          companyId: z.number(),
          groupName: z.string().min(1),
          departmentName: z.string().min(1),
          respondentCount: z.number().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return await createGroupForAssessment(
          input.assessmentId,
          input.companyId,
          input.groupName,
          input.departmentName,
          input.respondentCount
        );
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
        const assessment = await createAssessment(input.companyId);
        // Create assessment groups to isolate groups per assessment
        await createAssessmentGroupsForAssessment(assessment.id, input.companyId);
        // Create respondent sessions for all respondents in all groups
        await createRespondentSessionsForAssessment(assessment.id, input.companyId);
        return assessment;
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
        
        // Get unique group IDs from sessions for this assessment
        const uniqueGroupIds = Array.from(new Set(sessions.map(s => s.groupId)));
        
        // Get all groups for the company
        const allGroups = await getCompanyGroups(assessment.companyId);
        
        // Filter to only groups used in this assessment
        const groups = allGroups.filter(g => uniqueGroupIds.includes(g.id));
        
        let totalExpectedRespondents = 0;
        groups.forEach(g => totalExpectedRespondents += g.respondentCount);
        
        const groupStats = groups.map(group => {
          const groupSessions = sessions.filter(s => s.groupId === group.id);
          const completedCount = groupSessions.filter(s => s.isCompleted === 1).length;
          const pendingCount = group.respondentCount - completedCount;
          return {
            ...group,
            completedCount,
            pendingCount,
            sessionsCreated: groupSessions.length,
          };
        });

        const totalPendingRespondents = totalExpectedRespondents - completedSessions.length;

        return {
          assessment,
          totalRespondents: totalExpectedRespondents,
          completedRespondents: completedSessions.length,
          pendingRespondents: totalPendingRespondents,
          sessions,
          completedSessions,
          groups: groupStats,
        };
      }),

    finalize: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input }) => {
        await calculateConsolidatedResults(input.assessmentId);
        return await getAssessmentById(input.assessmentId);
      }),

    delete: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAssessment(input.assessmentId);
        return { success: true };
      }),

    getLastAssessmentData: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getLastAssessmentWithGroups(input.companyId);
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
        await saveIndividualAnswers(input.respondentSessionId, input.answers);
        const allCompleted = await checkAllRespondentsCompleted(input.assessmentId);
        if (allCompleted) {
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

    getCompanyIdByToken: publicProcedure
      .input(z.object({ accessToken: z.string() }))
      .query(async ({ input }) => {
        const companyId = await getCompanyIdByToken(input.accessToken);
        return { companyId };
      }),

    getAvailableAssessments: protectedProcedure.query(async ({ ctx }) => {
      return await getRespondentSessionsByEmail(ctx.user.email || "");
    }),
  }),

});

export type AppRouter = typeof appRouter;

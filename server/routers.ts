import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { callDataApi } from "./_core/dataApi";
import { sendEmail } from "./_core/emailService";
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
  createGroupForAssessment,
  getRespondentCompletionStats,
  updateRespondentInfo,
  getRespondentSessionsWithGroups,
  areAllRespondentEmailsFilled,
  getCompanyAssessmentsWithScores,
  getCompanyTotalScore,
  getCompanyAverageCompliance,
  getRespondentPreviousScores
} from "./db";
import { groups, assessmentGroups } from "../drizzle/schema";
import { inArray, eq } from "drizzle-orm";

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

    getByIdPublic: publicProcedure
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

    getByCompanyPublic: publicProcedure
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
      .input(z.object({ 
        companyId: z.number(),
        groups: z.array(z.object({
          groupName: z.string(),
          departmentName: z.string(),
          respondentCount: z.number(),
        })).optional()
      }))
      .mutation(async ({ input }) => {
        const assessment = await createAssessment(input.companyId);
        if (input.groups && input.groups.length > 0) {
          for (const group of input.groups) {
            await createGroupForAssessment(
              assessment.id,
              input.companyId,
              group.groupName,
              group.departmentName,
              group.respondentCount
            );
          }
        } else {
          await createAssessmentGroupsForAssessment(assessment.id, input.companyId);
          await createRespondentSessionsForAssessment(assessment.id, input.companyId);
        }
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
        
        // Get assessment group data with compliance percentages
        const db = await getDb();
        const assessmentGroupsData = db ? await db
          .select()
          .from(assessmentGroups)
          .where(eq(assessmentGroups.assessmentId, input.assessmentId)) : [];
        
        const groupStats = groups.map(group => {
          const groupSessions = sessions.filter(s => s.groupId === group.id);
          const completedCount = groupSessions.filter(s => s.isCompleted === 1).length;
          const pendingCount = group.respondentCount - completedCount;
          
          // Get compliance data for this group
          const groupData = assessmentGroupsData.find(ag => ag.groupId === group.id);
          const compliancePercentage = groupData?.compliancePercentage 
            ? (typeof groupData.compliancePercentage === 'string' 
              ? parseFloat(groupData.compliancePercentage) 
              : groupData.compliancePercentage)
            : 0;
          
          return {
            ...group,
            completedCount,
            pendingCount,
            sessionsCreated: groupSessions.length,
            compliancePercentage,
            totalScore: groupData?.totalScore || 0,
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

    getHistoryWithScores: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getCompanyAssessmentsWithScores(input.companyId);
      }),

    getTotalScore: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getCompanyTotalScore(input.companyId);
      }),

    getAverageCompliance: protectedProcedure
      .input(z.object({ companyId: z.number() }))
      .query(async ({ input }) => {
        return await getCompanyAverageCompliance(input.companyId);
      }),

    getPreviousRespondentScores: protectedProcedure
      .input(z.object({ companyId: z.number(), currentAssessmentNumber: z.number() }))
      .query(async ({ input }) => {
        return await getRespondentPreviousScores(input.companyId, input.currentAssessmentNumber);
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
        const assessment = await getAssessmentById(input.assessmentId);
        const stats = await getRespondentCompletionStats(input.assessmentId);
        return {
          ...assessment,
          respondentsRemaining: stats.remaining,
        };
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

    updateInfo: protectedProcedure
      .input(
        z.object({
          respondentSessionId: z.number(),
          respondentName: z.string().min(1, "Nome é obrigatório"),
          respondentEmail: z.string().email("Email inválido"),
        })
      )
      .mutation(async ({ input }) => {
        await updateRespondentInfo(
          input.respondentSessionId,
          input.respondentName,
          input.respondentEmail
        );
        return { success: true };
      }),

    getSessionsWithGroups: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await getRespondentSessionsWithGroups(input.assessmentId);
      }),

    checkAllEmailsFilled: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ input }) => {
        return await areAllRespondentEmailsFilled(input.assessmentId);
      }),

    sendEmailsToRespondents: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ input }) => {
        console.log("[EMAIL] Iniciando envio de emails para assessmentId:", input.assessmentId);
        
        const allFilled = await areAllRespondentEmailsFilled(input.assessmentId);
        console.log("[EMAIL] Todos os emails preenchidos?", allFilled);
        
        if (!allFilled) {
          throw new Error("Nem todos os emails dos respondentes foram preenchidos");
        }

        const sessions = await getRespondentSessionsWithGroups(input.assessmentId);
        console.log("[EMAIL] Sessões encontradas:", sessions.length);
        console.log("[EMAIL] Dados das sessões:", JSON.stringify(sessions, null, 2));
        
        const assessment = await getAssessmentById(input.assessmentId);
        const company = assessment ? await getCompanyById(assessment.companyId) : null;

        if (!assessment) {
          throw new Error("Avaliação não encontrada");
        }

        console.log("[EMAIL] Empresa:", company?.razaoSocial);
        console.log("[EMAIL] Total de sessões para enviar:", sessions.filter(s => s.respondentEmail).length);

        // Enviar emails para cada respondente
        const emailResults = [];
        for (const session of sessions) {
          if (!session.respondentEmail) {
            console.log("[EMAIL] Sessão sem email, pulando:", session.id);
            continue;
          }

          try {
            const respondentLink = `/respondent?token=${session.accessToken}`;
            const absoluteLink = `${process.env.VITE_FRONTEND_URL || 'https://lgpdassess-zbqzx56c.manus.space'}${respondentLink}`;
            console.log("[EMAIL] Enviando para:", session.respondentEmail, "Link absoluto:", absoluteLink);
            
            // Enviar email via emailService
            const emailResult = await sendEmail({
              to: session.respondentEmail,
              subject: `Avaliação de Conformidade LGPD - ${company?.razaoSocial || 'Sua Empresa'}`,
              html: `
                <h2>Avaliação de Conformidade LGPD</h2>
                <p>Olá ${session.respondentName || 'Respondente'},</p>
                <p>Você foi selecionado para participar da avaliação de conformidade LGPD da empresa <strong>${company?.razaoSocial}</strong>.</p>
                <p>Clique no link abaixo para acessar a avaliação:</p>
                <p><a href="${absoluteLink}">Acessar Avaliação</a></p>
                <p>Link direto: ${absoluteLink}</p>
                <p>Obrigado pela sua participação!</p>
              `,
            });
            
            if (emailResult.success) {
              console.log("[EMAIL] Email enviado com sucesso para:", session.respondentEmail, "MessageId:", emailResult.messageId);
              emailResults.push({
                email: session.respondentEmail,
                name: session.respondentName,
                success: true,
              });
            } else {
              throw new Error(emailResult.error || "Erro desconhecido ao enviar email");
            }
          } catch (error) {
            console.error(`[EMAIL] Erro ao enviar email para ${session.respondentEmail}:`, error);
            emailResults.push({
              email: session.respondentEmail,
              name: session.respondentName,
              success: false,
              error: error instanceof Error ? error.message : "Erro desconhecido",
            });
          }
        }

        const successCount = emailResults.filter((r) => r.success).length;
        const failureCount = emailResults.filter((r) => !r.success).length;

        console.log("[EMAIL] Resumo:", { successCount, failureCount, total: emailResults.length });

        return {
          success: failureCount === 0,
          emailsSent: successCount,
          emailsFailed: failureCount,
          message: `${successCount} emails enviados${failureCount > 0 ? `, ${failureCount} falharam` : ''}`,
          details: emailResults,
        };
      }),
  }),

});

export type AppRouter = typeof appRouter;

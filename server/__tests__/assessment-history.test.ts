import { describe, it, expect } from "vitest";

describe("Assessment History and Scoring", () => {
  it("should calculate total score from multiple assessments", () => {
    const assessments = [
      { id: 1, totalScore: 5000, isCompleted: 1 },
      { id: 2, totalScore: 6000, isCompleted: 1 },
      { id: 3, totalScore: 4500, isCompleted: 1 },
    ];

    const totalScore = assessments
      .filter((a) => a.isCompleted === 1)
      .reduce((sum, a) => sum + a.totalScore, 0);

    expect(totalScore).toBe(15500);
  });

  it("should calculate average compliance percentage", () => {
    const assessments = [
      { id: 1, compliancePercentage: 75.5, isCompleted: 1 },
      { id: 2, compliancePercentage: 82.3, isCompleted: 1 },
      { id: 3, compliancePercentage: 88.2, isCompleted: 1 },
    ];

    const completedAssessments = assessments.filter((a) => a.isCompleted === 1);
    const average =
      completedAssessments.reduce((sum, a) => sum + a.compliancePercentage, 0) /
      completedAssessments.length;

    expect(Math.round(average * 100) / 100).toBe(82);
  });

  it("should filter assessments before current assessment number", () => {
    const assessments = [
      { assessmentNumber: 1, totalScore: 5000 },
      { assessmentNumber: 2, totalScore: 6000 },
      { assessmentNumber: 3, totalScore: 4500 },
      { assessmentNumber: 4, totalScore: 7000 },
    ];

    const currentNumber = 3;
    const previousAssessments = assessments.filter((a) => a.assessmentNumber < currentNumber);

    expect(previousAssessments.length).toBe(2);
    expect(previousAssessments[0].assessmentNumber).toBe(1);
    expect(previousAssessments[1].assessmentNumber).toBe(2);
  });

  it("should sum respondent scores from previous assessments", () => {
    const respondentScores = [
      { assessmentNumber: 1, respondentName: "João", totalScore: 5000 },
      { assessmentNumber: 2, respondentName: "João", totalScore: 6000 },
      { assessmentNumber: 1, respondentName: "Maria", totalScore: 4500 },
      { assessmentNumber: 2, respondentName: "Maria", totalScore: 5500 },
    ];

    const joaoTotal = respondentScores
      .filter((s) => s.respondentName === "João")
      .reduce((sum, s) => sum + s.totalScore, 0);

    const mariaTotal = respondentScores
      .filter((s) => s.respondentName === "Maria")
      .reduce((sum, s) => sum + s.totalScore, 0);

    expect(joaoTotal).toBe(11000);
    expect(mariaTotal).toBe(10000);
  });

  it("should group assessments by assessment number", () => {
    const assessments = [
      { id: 1, assessmentNumber: 1, totalScore: 5000 },
      { id: 2, assessmentNumber: 2, totalScore: 6000 },
      { id: 3, assessmentNumber: 1, totalScore: 4500 },
      { id: 4, assessmentNumber: 2, totalScore: 5500 },
    ];

    const grouped = assessments.reduce(
      (acc, a) => {
        if (!acc[a.assessmentNumber]) acc[a.assessmentNumber] = [];
        acc[a.assessmentNumber].push(a);
        return acc;
      },
      {} as Record<number, typeof assessments>
    );

    expect(Object.keys(grouped).length).toBe(2);
    expect(grouped[1].length).toBe(2);
    expect(grouped[2].length).toBe(2);
  });

  it("should calculate progress bar percentage considering previous assessments", () => {
    const currentAssessmentScore = 5000;
    const previousAssessmentsScore = 15500;
    const maxPossibleScore = 50000; // 5 assessments × 10,000 each

    const totalScore = currentAssessmentScore + previousAssessmentsScore;
    const percentage = (totalScore / maxPossibleScore) * 100;

    expect(percentage).toBe(41);
  });

  it("should identify completed vs pending assessments", () => {
    const assessments = [
      { id: 1, isCompleted: 1 },
      { id: 2, isCompleted: 0 },
      { id: 3, isCompleted: 1 },
      { id: 4, isCompleted: 0 },
    ];

    const completed = assessments.filter((a) => a.isCompleted === 1).length;
    const pending = assessments.filter((a) => a.isCompleted === 0).length;

    expect(completed).toBe(2);
    expect(pending).toBe(2);
  });

  it("should calculate respondent count per assessment", () => {
    const respondents = [
      { id: 1, assessmentId: 1 },
      { id: 2, assessmentId: 1 },
      { id: 3, assessmentId: 1 },
      { id: 4, assessmentId: 2 },
      { id: 5, assessmentId: 2 },
    ];

    const countByAssessment = respondents.reduce(
      (acc, r) => {
        acc[r.assessmentId] = (acc[r.assessmentId] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>
    );

    expect(countByAssessment[1]).toBe(3);
    expect(countByAssessment[2]).toBe(2);
  });

  it("should sort assessments by assessment number descending", () => {
    const assessments = [
      { assessmentNumber: 1, totalScore: 5000 },
      { assessmentNumber: 3, totalScore: 4500 },
      { assessmentNumber: 2, totalScore: 6000 },
    ];

    const sorted = [...assessments].sort((a, b) => b.assessmentNumber - a.assessmentNumber);

    expect(sorted[0].assessmentNumber).toBe(3);
    expect(sorted[1].assessmentNumber).toBe(2);
    expect(sorted[2].assessmentNumber).toBe(1);
  });
});

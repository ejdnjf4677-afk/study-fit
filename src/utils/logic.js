// src/utils/logic.js

/**
 * 집중력 점수 계산 방식:
 * - 기본 점수 50점
 * - 목표 달성률에 따라 최대 30점 추가
 * - 중단 횟수가 적으면 최대 20점 추가
 * - 중단 횟수가 많으면 감점
 * - 최종 점수는 0점에서 100점 사이로 제한
 */
export const calculateConcentrationScore = (achievementRate, pauseCount) => {
  let score = 50;
  
  // 목표 달성률 (0~100) -> 최대 30점
  score += (achievementRate / 100) * 30;
  
  // 중단 횟수 (pauseCount)
  // 0회: 20점, 1회: 15점, 2회: 10점, 3회: 5점, 4회 이상: 0점 (혹은 감점)
  if (pauseCount === 0) score += 20;
  else if (pauseCount === 1) score += 15;
  else if (pauseCount === 2) score += 10;
  else if (pauseCount === 3) score += 5;
  else score -= (pauseCount - 4) * 5; // 4회부터는 감점
  
  return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * 포인트 지급 방식:
 * - 타이머 집중 50분 완료: 30P
 * - 감정 기록 작성: 10P
 * - 실패 원인 기록 작성: 10P
 * - 하루 목표 달성: 80P
 * - 3일 연속 공부: 150P
 * - 7일 연속 공부: 400P
 * - 집중력 점수 90점 이상: 100P
 */
export const POINTS = {
  SESSION_50MIN: 30,
  EMOTION_LOG: 10,
  FAILURE_LOG: 10,
  DAILY_GOAL: 80,
  STREAK_3DAY: 150,
  STREAK_7DAY: 400,
  FOCUS_90PLUS: 100,
};

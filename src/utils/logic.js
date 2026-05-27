// src/utils/logic.js

const NEGATIVE_EMOTIONS = ['나쁨', '매우 나쁨', '힘듦', '불안함', '졸림', '피곤함', '😩', '😰', '😴', 'tired', 'anxious', 'sleepy'];
const POSITIVE_EMOTIONS = ['매우 좋음', '좋음', '집중됨', '😊', '🤩', '😤', 'good', 'focused'];

const getEmotionValue = (emotion) => {
  const value = emotion?.emotion || emotion?.value || '';
  if (NEGATIVE_EMOTIONS.includes(value)) return -1;
  if (POSITIVE_EMOTIONS.includes(value)) return 1;
  return 0;
};

const getEmotionIntensity = (emotion) => {
  const raw = Number(emotion?.intensity);
  if (Number.isFinite(raw) && raw > 0) return Math.min(100, raw);
  return 60;
};

const calculateNegativeEmotionPenalty = (emotions = []) => {
  if (emotions.length === 0) return 0;
  return emotions.reduce((penalty, emotion) => {
    const value = getEmotionValue(emotion);
    if (value >= 0) return penalty;
    const intensity = getEmotionIntensity(emotion);
    if (intensity >= 80) return penalty + 8;
    if (intensity >= 60) return penalty + 6;
    return penalty + 4;
  }, 0);
};

const calculateFailurePenalty = (failures = []) => {
  if (failures.length === 0) return 0;
  return Math.min(15, failures.length * 5);
};

const calculateShortSessionPenalty = (records = []) => {
  if (records.length === 0) return 0;
  const shortSessions = records.filter(record => (record.durationMinutes || 0) > 0 && (record.durationMinutes || 0) < 15).length;
  const shortRatio = shortSessions / records.length;
  if (shortSessions >= 4 || shortRatio >= 0.6) return 10;
  if (shortSessions >= 2 || shortRatio >= 0.4) return 6;
  if (shortSessions === 1) return 3;
  return 0;
};

const calculatePauseDurationPenalty = (records = [], pauseCount = 0) => {
  const measuredPauseMinutes = records.reduce((sum, record) => {
    const pauseMinutes = record.pauseMinutes ?? record.pauseDurationMinutes ?? record.breakMinutes ?? 0;
    return sum + Number(pauseMinutes || 0);
  }, 0);
  const estimatedPauseMinutes = measuredPauseMinutes > 0 ? measuredPauseMinutes : pauseCount * 3;
  if (estimatedPauseMinutes >= 45) return 12;
  if (estimatedPauseMinutes >= 25) return 8;
  if (estimatedPauseMinutes >= 10) return 4;
  return 0;
};

const calculateTimeBiasPenalty = (records = []) => {
  const totalMinutes = records.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
  if (totalMinutes < 120 || records.length < 2) return 0;

  const slots = [0, 0, 0, 0];
  let lateNightMinutes = 0;
  records.forEach(record => {
    const minutes = record.durationMinutes || 0;
    const hour = new Date(record.timestamp).getHours();
    const slot = Math.floor(hour / 6);
    slots[slot] += minutes;
    if (hour >= 22 || hour < 5) lateNightMinutes += minutes;
  });

  const biggestSlotRatio = Math.max(...slots) / totalMinutes;
  const lateNightRatio = lateNightMinutes / totalMinutes;
  if (lateNightRatio >= 0.6) return 8;
  if (biggestSlotRatio >= 0.85) return 6;
  return 0;
};

const calculateEmotionMismatchPenalty = (emotions = [], achievementRate = 0, records = []) => {
  if (emotions.length === 0) return 0;
  const totalMinutes = records.reduce((sum, record) => sum + (record.durationMinutes || 0), 0);
  const avgEmotion = emotions.reduce((sum, emotion) => sum + getEmotionValue(emotion) * getEmotionIntensity(emotion), 0) / emotions.length;

  if (avgEmotion <= -65 && achievementRate >= 80) return 6;
  if (avgEmotion >= 65 && achievementRate < 30 && totalMinutes < 30) return 5;
  return 0;
};

/**
 * 집중력 점수 계산 방식:
 * - 기본 점수 50점
 * - 목표 달성률에 따라 최대 30점 추가
 * - 중단 횟수가 적으면 최대 20점 추가
 * - 여러 마이너스 요소를 추가 감점
 * - 최종 점수는 0점에서 100점 사이로 제한
 */
export const calculateConcentrationScore = (achievementRate, pauseCount, details = {}) => {
  let score = 50;
  const records = details.records || [];
  const emotions = details.emotions || [];
  const failures = details.failures || [];
  const safePauseCount = Number(pauseCount || 0);

  score += (achievementRate / 100) * 30;

  if (safePauseCount === 0) score += 20;
  else if (safePauseCount === 1) score += 15;
  else if (safePauseCount === 2) score += 10;
  else if (safePauseCount === 3) score += 5;
  else score -= (safePauseCount - 4) * 5;

  const penalties = [
    calculateNegativeEmotionPenalty(emotions),
    calculateFailurePenalty(failures),
    calculateShortSessionPenalty(records),
    calculatePauseDurationPenalty(records, safePauseCount),
    calculateTimeBiasPenalty(records),
    calculateEmotionMismatchPenalty(emotions, achievementRate, records)
  ];

  score -= Math.min(35, penalties.reduce((sum, penalty) => sum + penalty, 0));

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

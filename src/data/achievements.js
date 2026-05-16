/**
 * @typedef {Object} AchievementProgress
 * @property {number} currentValue
 * @property {number} targetValue
 * @property {boolean} isUnlocked
 * @property {Date|null} unlockedAt
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} iconReference
 * @property {string} categoryType
 * @property {string} associatedColor
 * @property {AchievementProgress} progress
 */

export const achievementsData = [
  {
    id: "ach-1",
    name: "First Step",
    description: "Complete your very first lesson.",
    iconReference: "school",
    categoryType: "milestone",
    associatedColor: "#3DDC97", // Success green
    progress: {
      currentValue: 0,
      targetValue: 1,
      isUnlocked: false,
      unlockedAt: null
    }
  },
  {
    id: "ach-2",
    name: "Perfect Score",
    description: "Achieve a 100% correct answer rate on any lesson test.",
    iconReference: "emoji_events",
    categoryType: "mastery",
    associatedColor: "#FFB547", // Gold/Yellow
    progress: {
      currentValue: 0,
      targetValue: 1,
      isUnlocked: false,
      unlockedAt: null
    }
  },
  {
    id: "ach-3",
    name: "Consistent Scholar",
    description: "Maintain a learning streak for 3 consecutive days.",
    iconReference: "local_fire_department",
    categoryType: "consistency",
    associatedColor: "#FF647C", // Red/Orange
    progress: {
      currentValue: 0,
      targetValue: 3,
      isUnlocked: false,
      unlockedAt: null
    }
  },
  {
    id: "ach-4",
    name: "Speed Learner",
    description: "Complete 5 lessons within a single 24-hour period.",
    iconReference: "bolt",
    categoryType: "speed",
    associatedColor: "#3D5CFF", // Primary Blue
    progress: {
      currentValue: 0,
      targetValue: 5,
      isUnlocked: false,
      unlockedAt: null
    }
  },
  {
    id: "ach-5",
    name: "Polymath",
    description: "Engage with lessons from 3 different academic domains.",
    iconReference: "explore",
    categoryType: "exploration",
    associatedColor: "#A78BFA", // Purple
    progress: {
      currentValue: 0,
      targetValue: 3,
      isUnlocked: false,
      unlockedAt: null
    }
  },
  {
    id: "ach-6",
    name: "Domain Master",
    description: "Achieve 100% completion in all lessons of a single course.",
    iconReference: "workspace_premium",
    categoryType: "completion",
    associatedColor: "#FF9F43", // Orange
    progress: {
      currentValue: 0,
      targetValue: 1,
      isUnlocked: false,
      unlockedAt: null
    }
  }
];
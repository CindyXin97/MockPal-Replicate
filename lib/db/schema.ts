import { sql } from 'drizzle-orm';
import { InferModel, relations } from 'drizzle-orm';
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean,
  primaryKey,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

// Users schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  emailVerified: timestamp('email_verified'),
  passwordHash: varchar('password_hash', { length: 255 }),
  image: text('image'),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User profiles schema with tags
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  
  // Required tags
  jobType: varchar('job_type', { length: 50 }).notNull(), // DA/DS/DE
  experienceLevel: varchar('experience_level', { length: 50 }).notNull(), // 应届/1-3年/3年+
  jobSeekingStatus: varchar('job_seeking_status', { length: 50 }), // 求职状态
  
  // Optional tags
  targetCompany: varchar('target_company', { length: 255 }),
  targetIndustry: varchar('target_industry', { length: 255 }),
  otherCompanyName: varchar('other_company_name', { length: 255 }), // 存储用户自定义的公司名称
  
  // Required practice content
  technicalInterview: boolean('technical_interview').default(false),
  behavioralInterview: boolean('behavioral_interview').default(false),
  caseAnalysis: boolean('case_analysis').default(false),
  statsQuestions: boolean('stats_questions').default(false),
  
  // Contact information (revealed after match)
  email: varchar('email', { length: 255 }),
  wechat: varchar('wechat', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),

  bio: varchar('bio', { length: 255 }),
  school: varchar('school', { length: 255 }).notNull(), // 学校信息（必填）
  skills: text('skills'), // 技能信息，JSON格式存储，最多3个技能，每个不超过12个字符
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User profile history schema - 保存所有修改历史
export const userProfileHistory = pgTable('user_profile_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  profileId: integer('profile_id').references(() => userProfiles.id),
  
  // 完整的资料快照
  jobType: varchar('job_type', { length: 50 }),
  experienceLevel: varchar('experience_level', { length: 50 }),
  jobSeekingStatus: varchar('job_seeking_status', { length: 50 }),
  targetCompany: varchar('target_company', { length: 255 }),
  targetIndustry: varchar('target_industry', { length: 255 }),
  otherCompanyName: varchar('other_company_name', { length: 255 }),
  technicalInterview: boolean('technical_interview'),
  behavioralInterview: boolean('behavioral_interview'),
  caseAnalysis: boolean('case_analysis'),
  statsQuestions: boolean('stats_questions'),
  email: varchar('email', { length: 255 }),
  wechat: varchar('wechat', { length: 255 }),
  linkedin: varchar('linkedin', { length: 255 }),
  bio: varchar('bio', { length: 255 }),
  school: varchar('school', { length: 255 }),
  skills: text('skills'), // 技能信息，JSON格式存储
  
  // 变更元数据
  changeType: varchar('change_type', { length: 20 }).default('update'), // create, update, delete
  changedFields: text('changed_fields').array(), // 记录修改的字段
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Matches schema
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  user1Id: integer('user1_id').references(() => users.id).notNull(),
  user2Id: integer('user2_id').references(() => users.id).notNull(),
  
  // 用户的实际操作：like(喜欢), dislike(不喜欢), cancel(取消)
  actionType: varchar('action_type', { length: 20 }),
  
  // 匹配状态：pending(等待回应), accepted(匹配成功), rejected(已拒绝)
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  
  // 联系和面试状态跟踪
  contactStatus: varchar('contact_status', { length: 50 }).default('not_contacted'), // not_contacted, contacted, scheduled, completed, no_response
  contactUpdatedAt: timestamp('contact_updated_at'),
  interviewScheduledAt: timestamp('interview_scheduled_at'),
  lastReminderSent: timestamp('last_reminder_sent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Feedbacks schema
export const feedbacks = pgTable('feedbacks', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id),
  userId: integer('user_id').references(() => users.id).notNull(),
  contactStatus: varchar('contact_status', { length: 10 }), // 'yes' or 'no' - 是否添加联系方式
  interviewStatus: varchar('interview_status', { length: 10 }).notNull(), // 'yes' or 'no' - 是否进行面试
  content: text('content'), // 面试反馈内容
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User achievements schema
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull().unique(),
  totalInterviews: integer('total_interviews').default(0).notNull(),
  experiencePoints: integer('experience_points').default(0).notNull(),
  currentLevel: varchar('current_level', { length: 50 }).default('新用户').notNull(),
  // 新增统计字段
  totalViews: integer('total_views').default(0), // 总浏览人数
  totalMatches: integer('total_matches').default(0), // 总匹配数
  successfulMatches: integer('successful_matches').default(0), // 匹配成功数
  postsCount: integer('posts_count').default(0), // 发布的题目数
  commentsCount: integer('comments_count').default(0), // 评论数
  votesGiven: integer('votes_given').default(0), // 点赞数
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户每日浏览记录
export const userDailyViews = pgTable('user_daily_views', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  viewedUserId: integer('viewed_user_id').references(() => users.id).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // 格式: YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 邮件发送记录表 - 用于限流和审计
export const emailSendLogs = pgTable('email_send_logs', {
  id: serial('id').primaryKey(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(), // 收件人邮箱
  emailType: varchar('email_type', { length: 50 }).notNull(), // 邮件类型: login, password_setup, match_success, mention
  subject: varchar('subject', { length: 255 }), // 邮件主题
  status: varchar('status', { length: 20 }).notNull().default('sent'), // sent, failed, skipped
  errorMessage: text('error_message'), // 如果失败，记录错误信息
  sentAt: timestamp('sent_at').defaultNow().notNull(), // 发送时间
});

// 面试真题表
export const interviewQuestions = pgTable('interview_questions', {
  id: serial('id').primaryKey(),
  company: varchar('company', { length: 100 }).notNull(), // 公司名称
  position: varchar('position', { length: 100 }).notNull(), // 职位
  questionType: varchar('question_type', { length: 50 }).notNull(), // 题目类型: technical, behavioral, case_study, stats
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // 难度: easy, medium, hard
  question: text('question').notNull(), // 问题内容
  recommendedAnswer: text('recommended_answer'), // 推荐答案
  tags: text('tags'), // 标签，JSON格式存储
  source: varchar('source', { length: 100 }), // 来源
  year: integer('year').notNull(), // 年份
  isVerified: boolean('is_verified').default(false), // 是否已验证
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 面经需求表
export const interviewRequests = pgTable('interview_requests', {
  id: serial('id').primaryKey(),
  company: varchar('company', { length: 100 }).notNull(), // 公司名称
  position: varchar('position', { length: 100 }).notNull(), // 职位名称
  message: text('message'), // 补充说明
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, processing, completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户发布的面试题目表
export const userInterviewPosts = pgTable('user_interview_posts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  company: varchar('company', { length: 100 }).notNull(),
  position: varchar('position', { length: 100 }).notNull(),
  questionType: varchar('question_type', { length: 50 }).notNull(), // technical, behavioral, case_study, stats
  difficulty: varchar('difficulty', { length: 20 }).notNull(), // easy, medium, hard
  interviewDate: timestamp('interview_date').notNull(), // 面试日期
  question: text('question').notNull(),
  recommendedAnswer: text('recommended_answer'), // 可选的推荐答案
  isAnonymous: boolean('is_anonymous').default(false), // 是否匿名发布
  status: varchar('status', { length: 20 }).default('active'), // active, hidden, deleted
  viewsCount: integer('views_count').default(0), // 浏览次数
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 评论表（支持系统题目和用户发布的题目）
export const interviewComments: any = pgTable('interview_comments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postType: varchar('post_type', { length: 20 }).notNull(), // 'system' or 'user'
  postId: integer('post_id').notNull(), // interview_questions.id 或 user_interview_posts.id
  content: text('content').notNull(),
  parentCommentId: integer('parent_comment_id').references(() => interviewComments.id, { onDelete: 'cascade' }),
  isAnonymous: boolean('is_anonymous').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 点赞/踩表
export const interviewVotes = pgTable('interview_votes', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postType: varchar('post_type', { length: 20 }).notNull(), // 'system' or 'user'
  postId: integer('post_id').notNull(),
  voteType: varchar('vote_type', { length: 10 }).notNull(), // 'up' or 'down'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户收藏题目表
export const userSavedQuestions = pgTable('user_saved_questions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  questionType: varchar('question_type', { length: 20 }).notNull(), // 'system' or 'user'
  questionId: integer('question_id').notNull(), // interview_questions.id 或 user_interview_posts.id
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 用户通知表
export const userNotifications = pgTable('user_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // comment_reply, comment_mention, post_comment, vote_up, match_success
  actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorName: varchar('actor_name', { length: 255 }),
  postType: varchar('post_type', { length: 20 }),
  postId: integer('post_id'),
  commentId: integer('comment_id').references(() => interviewComments.id, { onDelete: 'cascade' }),
  matchId: integer('match_id').references(() => matches.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  link: text('link'),
  isRead: boolean('is_read').default(false),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  readAt: timestamp('read_at'),
});

// 用户通知设置表
export const userNotificationSettings = pgTable('user_notification_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  notifyCommentReply: boolean('notify_comment_reply').default(true),
  notifyMention: boolean('notify_mention').default(true),
  notifyPostComment: boolean('notify_post_comment').default(true),
  notifyVote: boolean('notify_vote').default(false),
  notifyMatch: boolean('notify_match').default(true),
  emailDigestEnabled: boolean('email_digest_enabled').default(true),
  emailDigestFrequency: varchar('email_digest_frequency', { length: 20 }).default('weekly'),
  lastDigestSent: timestamp('last_digest_sent'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  matchesAsUser1: many(matches, {
    relationName: 'user1',
  }),
  matchesAsUser2: many(matches, {
    relationName: 'user2',
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
  }),
}));

// Types
// NextAuth相关表
export const accounts = pgTable('accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => {
  return {
    compositePk: primaryKey({ columns: [table.identifier, table.token] }),
  };
});

// 用户每日奖励配额表
export const userDailyBonus = pgTable('user_daily_bonus', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD格式
  postsToday: integer('posts_today').default(0).notNull(), // 今日发帖数
  commentsToday: integer('comments_today').default(0).notNull(), // 今日评论数
  bonusQuota: integer('bonus_quota').default(0).notNull(), // 当天新增的奖励配额
  bonusBalance: integer('bonus_balance').default(0).notNull(), // 奖励配额余额（可累积，上限6）
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    uniqueUserDate: unique().on(table.userId, table.date),
  };
});

export type User = InferModel<typeof users>;
export type UserProfile = InferModel<typeof userProfiles>;
export type UserProfileHistory = InferModel<typeof userProfileHistory>;
export type Match = InferModel<typeof matches>;
export type Feedback = InferModel<typeof feedbacks>;
export type UserAchievement = InferModel<typeof userAchievements>;
export type Account = InferModel<typeof accounts>;
export type Session = InferModel<typeof sessions>;
export type VerificationToken = InferModel<typeof verificationTokens>;
export type InterviewQuestion = InferModel<typeof interviewQuestions>;
export type InterviewRequest = InferModel<typeof interviewRequests>;
export type UserInterviewPost = InferModel<typeof userInterviewPosts>;
export type InterviewComment = InferModel<typeof interviewComments>;
export type InterviewVote = InferModel<typeof interviewVotes>;
export type UserSavedQuestion = InferModel<typeof userSavedQuestions>;
export type UserDailyBonus = InferModel<typeof userDailyBonus>; 
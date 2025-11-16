import { db } from '@/lib/db';
import { userNotifications, users, userNotificationSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from '@/lib/email-service';

interface CreateNotificationParams {
  userId: number;
  type: string;
  actorId: number;
  actorName: string;
  title: string;
  content?: string;
  link?: string;
  postType?: string;
  postId?: number;
  commentId?: number;
  matchId?: number;
}

/**
 * 创建通知
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // 1. 检查用户通知设置
    const settings = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, params.userId))
      .limit(1);

    // 如果没有设置，使用默认值（都开启）
    const userSettings = settings[0] || {
      notifyCommentReply: true,
      notifyMention: true,
      notifyPostComment: true,
      notifyVote: false,
      notifyMatch: true,
    };

    // 2. 根据通知类型检查是否应该发送
    let shouldNotify = true;
    switch (params.type) {
      case 'comment_reply':
        shouldNotify = userSettings.notifyCommentReply ?? true;
        break;
      case 'comment_mention':
        shouldNotify = userSettings.notifyMention ?? true;
        break;
      case 'post_comment':
        shouldNotify = userSettings.notifyPostComment ?? true;
        break;
      case 'vote_up':
        shouldNotify = userSettings.notifyVote ?? false;
        break;
      case 'match_success':
        shouldNotify = userSettings.notifyMatch ?? true;
        break;
    }

    if (!shouldNotify) {
      console.log(`⏭️ [通知] 用户 ${params.userId} 已关闭 ${params.type} 类型通知`);
      return null;
    }

    // 3. 创建通知
    const notification = await db
      .insert(userNotifications)
      .values({
        userId: params.userId,
        type: params.type,
        actorId: params.actorId,
        actorName: params.actorName,
        title: params.title,
        content: params.content,
        link: params.link,
        postType: params.postType,
        postId: params.postId,
        commentId: params.commentId,
        matchId: params.matchId,
      })
      .returning();

    console.log(`✅ [通知] 创建成功: ${params.title}`);
    return notification[0];
  } catch (error) {
    console.error('❌ [通知] 创建失败:', error);
    return null;
  }
}

/**
 * 评论被回复时创建通知
 */
export async function notifyCommentReply(
  originalCommentAuthorId: number,
  replyAuthorId: number,
  replyAuthorName: string,
  replyContent: string,
  postType: string,
  postId: number,
  commentId: number
) {
  // 不给自己发通知
  if (originalCommentAuthorId === replyAuthorId) {
    return null;
  }

  return createNotification({
    userId: originalCommentAuthorId,
    type: 'comment_reply',
    actorId: replyAuthorId,
    actorName: replyAuthorName,
    title: `${replyAuthorName} 回复了你的评论`,
    content: replyContent.slice(0, 100),
    link: `/matches?tab=questions#comment-${commentId}`,
    postType,
    postId,
    commentId,
  });
}

/**
 * 被@提及时创建通知
 */
export async function notifyMentioned(
  mentionedUserId: number,
  actorId: number,
  actorName: string,
  content: string,
  postType: string,
  postId: number
) {
  // 不给自己发通知
  if (mentionedUserId === actorId) {
    return null;
  }

  // 创建站内通知
  const notification = await createNotification({
    userId: mentionedUserId,
    type: 'comment_mention',
    actorId,
    actorName,
    title: `${actorName} mentioned you in a comment / 在评论中提到了你`,
    content: content.slice(0, 100),
    link: `/matches?tab=questions&postType=${postType}&postId=${postId}`,
    postType,
    postId,
  });

  // 发送邮件通知
  try {
    // 获取被提及用户的邮箱
    const mentionedUser = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, mentionedUserId))
      .limit(1);

    if (mentionedUser.length > 0 && mentionedUser[0].email) {
      const commentUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/matches?tab=questions&postType=${postType}&postId=${postId}`;
      
      await emailService.sendMentionEmail(mentionedUser[0].email, {
        actorName,
        content,
        postType,
        postId,
        commentUrl,
      });
      
      console.log(`✅ [通知] @提及邮件已发送给用户 ${mentionedUserId}`);
    }
  } catch (emailError) {
    console.error('⚠️ [通知] @提及邮件发送失败（不影响站内通知）:', emailError);
    // 邮件发送失败不影响站内通知
  }

  return notification;
}

/**
 * 我的题目有新评论时创建通知
 */
export async function notifyPostComment(
  postAuthorId: number,
  commentAuthorId: number,
  commentAuthorName: string,
  commentContent: string,
  postType: string,
  postId: number
) {
  // 不给自己发通知
  if (postAuthorId === commentAuthorId) {
    return null;
  }

  return createNotification({
    userId: postAuthorId,
    type: 'post_comment',
    actorId: commentAuthorId,
    actorName: commentAuthorName,
    title: `${commentAuthorName} 评论了你的题目`,
    content: commentContent.slice(0, 100),
    link: `/matches?tab=questions&postType=${postType}&postId=${postId}`,
    postType,
    postId,
  });
}

/**
 * 匹配成功时创建通知
 */
export async function notifyMatchSuccess(
  userId: number,
  matchedUserId: number,
  matchedUserName: string,
  matchId: number
) {
  return createNotification({
    userId,
    type: 'match_success',
    actorId: matchedUserId,
    actorName: matchedUserName,
    title: `你和 ${matchedUserName} 匹配成功了！`,
    content: '快去联系对方安排面试吧',
    link: '/matches',
    matchId,
  });
}

/**
 * 解析评论中的@提及
 * 返回被提及的用户ID列表
 */
export async function parseMentions(content: string): Promise<number[]> {
  // 匹配 @用户名 模式
  const mentionRegex = /@(\S+)/g;
  const matches = content.matchAll(mentionRegex);
  const usernames = new Set<string>();

  for (const match of matches) {
    usernames.add(match[1]);
  }

  if (usernames.size === 0) {
    return [];
  }

  // 查询用户ID（通过用户名或邮箱前缀）
  const mentionedUserIds: number[] = [];

  for (const username of usernames) {
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(
        eq(users.name, username) // 暂时只匹配用户名
      )
      .limit(1);

    if (user.length > 0) {
      mentionedUserIds.push(user[0].id);
    }
  }

  return mentionedUserIds;
}


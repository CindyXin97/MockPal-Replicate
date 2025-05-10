import { db } from '@/lib/db';
import { users, userProfiles, matches } from '@/lib/db/schema';
import { eq, and, or, not, desc } from 'drizzle-orm';

// Get potential matches for a user
export async function getPotentialMatches(userId: number) {
  try {
    // First, get the user's profile
    const userProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (!userProfile) {
      return { success: false, message: '请先完成个人资料' };
    }

    // Get users who haven't been matched with the current user yet
    const existingMatches = await db.query.matches.findMany({
      where: or(
        eq(matches.user1Id, userId),
        eq(matches.user2Id, userId)
      ),
    });

    // Extract IDs of users already in matches
    const matchedUserIds = existingMatches.map(match => 
      match.user1Id === userId ? match.user2Id : match.user1Id
    );

    // Add current user's ID to the list of excluded IDs
    const excludedIds = [...matchedUserIds, userId];

    // Find potential matches based on compatible tags
    // For this demo, we'll simply find users with the same job type
    // In a full version, you'd implement a more sophisticated algorithm
    const potentialMatches = await db.query.users.findMany({
      where: not(
        eq(users.id, userId)
      ),
      with: {
        profile: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    // Filter out users that are already matched or don't have a profile
    const filteredMatches = potentialMatches.filter(user => 
      !excludedIds.includes(user.id) && user.profile
    );

    return { 
      success: true, 
      matches: filteredMatches.map(user => ({
        id: user.id,
        username: user.username,
        jobType: user.profile?.jobType,
        experienceLevel: user.profile?.experienceLevel,
        targetCompany: user.profile?.targetCompany,
        targetIndustry: user.profile?.targetIndustry,
        practicePreferences: {
          technicalInterview: user.profile?.technicalInterview,
          behavioralInterview: user.profile?.behavioralInterview,
          caseAnalysis: user.profile?.caseAnalysis,
        },
      }))
    };
  } catch (error) {
    console.error('Get potential matches error:', error);
    return { success: false, message: '获取匹配失败，请稍后再试' };
  }
}

// Create match (like a user)
export async function createMatch(userId: number, targetUserId: number) {
  try {
    // Check if match already exists
    const existingMatch = await db.query.matches.findFirst({
      where: or(
        and(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, targetUserId)
        ),
        and(
          eq(matches.user1Id, targetUserId),
          eq(matches.user2Id, userId)
        )
      ),
    });

    if (existingMatch) {
      // If user2 has already liked user1, update match status to accepted
      if (existingMatch.user1Id === targetUserId && existingMatch.status === 'pending') {
        await db
          .update(matches)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return { success: true, match: true, message: '匹配成功！' };
      }

      // If user1 has already liked user2, but user2 is liking user1 now, this shouldn't happen
      // But let's handle it by updating the match to accepted
      if (existingMatch.user1Id === userId && existingMatch.status === 'pending') {
        await db
          .update(matches)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return { success: true, match: true, message: '匹配成功！' };
      }

      // If the match is already accepted, just return success
      if (existingMatch.status === 'accepted') {
        return { success: true, match: true, message: '已经匹配成功！' };
      }

      // If the match was rejected, update it to pending
      if (existingMatch.status === 'rejected') {
        await db
          .update(matches)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(eq(matches.id, existingMatch.id));

        return { success: true, match: false, message: '已收到你的喜欢！等待对方回应。' };
      }
    }

    // Create new match
    await db.insert(matches).values({
      user1Id: userId,
      user2Id: targetUserId,
      status: 'pending',
    });

    return { success: true, match: false, message: '已收到你的喜欢！等待对方回应。' };
  } catch (error) {
    console.error('Create match error:', error);
    return { success: false, message: '操作失败，请稍后再试' };
  }
}

// Reject match (dislike a user)
export async function rejectMatch(userId: number, targetUserId: number) {
  try {
    // Check if match already exists
    const existingMatch = await db.query.matches.findFirst({
      where: or(
        and(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, targetUserId)
        ),
        and(
          eq(matches.user1Id, targetUserId),
          eq(matches.user2Id, userId)
        )
      ),
    });

    if (existingMatch) {
      // Update match status to rejected
      await db
        .update(matches)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(matches.id, existingMatch.id));
    } else {
      // Create new match with rejected status
      await db.insert(matches).values({
        user1Id: userId,
        user2Id: targetUserId,
        status: 'rejected',
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Reject match error:', error);
    return { success: false, message: '操作失败，请稍后再试' };
  }
}

// Get successful matches for a user
export async function getSuccessfulMatches(userId: number) {
  try {
    const successfulMatches = await db.query.matches.findMany({
      where: and(
        or(
          eq(matches.user1Id, userId),
          eq(matches.user2Id, userId)
        ),
        eq(matches.status, 'accepted')
      ),
    });

    // Get the matched users' details
    const matchedUsers = await Promise.all(
      successfulMatches.map(async (match) => {
        const matchedUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
        
        const matchedUser = await db.query.users.findFirst({
          where: eq(users.id, matchedUserId),
          with: {
            profile: true,
          },
        });

        if (!matchedUser || !matchedUser.profile) {
          return null;
        }

        return {
          id: matchedUser.id,
          username: matchedUser.username,
          jobType: matchedUser.profile.jobType,
          experienceLevel: matchedUser.profile.experienceLevel,
          targetCompany: matchedUser.profile.targetCompany,
          targetIndustry: matchedUser.profile.targetIndustry,
          practicePreferences: {
            technicalInterview: matchedUser.profile.technicalInterview,
            behavioralInterview: matchedUser.profile.behavioralInterview,
            caseAnalysis: matchedUser.profile.caseAnalysis,
          },
          contactInfo: {
            email: matchedUser.profile.email,
            wechat: matchedUser.profile.wechat,
          },
        };
      })
    );

    // Filter out null values
    const filteredMatches = matchedUsers.filter(Boolean);

    return { success: true, matches: filteredMatches };
  } catch (error) {
    console.error('Get successful matches error:', error);
    return { success: false, message: '获取匹配失败，请稍后再试' };
  }
} 
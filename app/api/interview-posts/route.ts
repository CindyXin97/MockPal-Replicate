import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-config';
import { db } from '@/lib/db';
import { userInterviewPosts, users, userDailyBonus } from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// 检测文本主要语言
function detectLanguage(text: string): 'zh' | 'en' {
  if (!text) return 'zh';
  
  // 计算中文字符和英文字符（不含空格和标点）
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  
  // 如果中文字符超过15个，判定为中文
  if (chineseChars > 15) {
    return 'zh';
  }
  
  // 如果英文字符数量明显多于中文字符（3倍以上），判定为英文
  if (englishChars > chineseChars * 3) {
    return 'en';
  }
  
  // 如果中文字符多于英文字符，判定为中文
  if (chineseChars > englishChars * 0.3) {
    return 'zh';
  }
  
  // 默认判定为英文
  return 'en';
}

// POST - 创建用户发布的面试题目
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      );
    }

    // 获取用户ID
    const userResult = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;

    // 获取请求数据
    const body = await request.json();
    const {
      company,
      position,
      questionType,
      difficulty,
      interviewDate,
      question,
      recommendedAnswer,
      isAnonymous = false,
    } = body;

    // 验证必填字段
    if (!company || !position || !questionType || !difficulty || !interviewDate || !question) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证题目类型
    const validQuestionTypes = ['technical', 'behavioral', 'case_study', 'stats'];
    if (!validQuestionTypes.includes(questionType)) {
      return NextResponse.json(
        { success: false, message: '无效的题目类型' },
        { status: 400 }
      );
    }

    // 验证难度
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { success: false, message: '无效的难度级别' },
        { status: 400 }
      );
    }

    // 检查发布频率限制（每天最多5条）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPosts = await db
      .select({ count: sql<number>`count(*)` })
      .from(userInterviewPosts)
      .where(
        and(
          eq(userInterviewPosts.userId, userId),
          sql`${userInterviewPosts.createdAt} >= ${today.toISOString()}`
        )
      );

    if (todayPosts[0]?.count >= 5) {
      return NextResponse.json(
        { success: false, message: '每天最多发布5道题目，请明天再试' },
        { status: 429 }
      );
    }

    // 自动检测语言
    const detectedLanguage = detectLanguage(question + ' ' + (recommendedAnswer || ''));
    
    // 插入数据
    const newPost = await db
      .insert(userInterviewPosts)
      .values({
        userId,
        company,
        position,
        questionType,
        difficulty,
        interviewDate: new Date(interviewDate),
        question,
        recommendedAnswer: recommendedAnswer || null,
        language: detectedLanguage, // 自动检测的语言
        isAnonymous,
        status: 'active',
        viewsCount: 0,
      })
      .returning();

    // 检查并发放奖励配额
    const ET_TIMEZONE = 'America/New_York';
    const now = new Date();
    const etDate = toZonedTime(now, ET_TIMEZONE);
    const todayStr = format(etDate, 'yyyy-MM-dd');
    
    try {
      // 查询今日是否已有记录
      const existingBonus = await db.query.userDailyBonus.findFirst({
        where: and(
          eq(userDailyBonus.userId, userId),
          eq(userDailyBonus.date, todayStr)
        ),
      });
      
      if (existingBonus) {
        // 如果今天还没发过帖，且余额未满，给予奖励
        if (existingBonus.postsToday === 0 && existingBonus.bonusBalance < 6) {
          const newBalance = Math.min(existingBonus.bonusBalance + 2, 6);
          await db
            .update(userDailyBonus)
            .set({
              postsToday: 1,
              bonusQuota: existingBonus.bonusQuota + 2,
              bonusBalance: newBalance,
              updatedAt: new Date(),
            })
            .where(eq(userDailyBonus.id, existingBonus.id));
          
          return NextResponse.json({
            success: true,
            message: '题目发布成功！',
            data: (newPost as any)[0],
            bonus: {
              earned: true,
              quota: 2,
              message: '🎉 恭喜！你获得了+2个匹配配额',
              newBalance: newBalance,
            }
          });
        } else if (existingBonus.bonusBalance >= 6) {
          // 余额已满
          return NextResponse.json({
            success: true,
            message: '题目发布成功！',
            data: (newPost as any)[0],
            bonus: {
              earned: false,
              message: '💰 奖励配额已满(6/6)，请先使用后再发帖获取奖励',
            }
          });
        }
      } else {
        // 创建新记录（继承昨天的余额）
        const recentBonus = await db.query.userDailyBonus.findFirst({
          where: eq(userDailyBonus.userId, userId),
          orderBy: (table, { desc }) => [desc(table.date)],
        });

        const inheritedBalance = recentBonus?.bonusBalance || 0;
        const newBalance = Math.min(inheritedBalance + 2, 6);
        
        await db.insert(userDailyBonus).values({
          userId,
          date: todayStr,
          postsToday: 1,
          commentsToday: 0,
          bonusQuota: 2,
          bonusBalance: newBalance,
        });
        
        return NextResponse.json({
          success: true,
          message: '题目发布成功！',
          data: (newPost as any)[0],
          bonus: {
            earned: true,
            quota: 2,
            message: '🎉 恭喜！你获得了+2个匹配配额',
            newBalance: newBalance,
          }
        });
      }
    } catch (bonusError) {
      console.error('Error awarding bonus:', bonusError);
      // 即使奖励发放失败，帖子已经创建成功，不影响主流程
    }

    return NextResponse.json({
      success: true,
      message: '题目发布成功！',
      data: (newPost as any)[0],
      bonus: {
        earned: false,
        message: '今日发帖奖励已领取',
      }
    });
  } catch (error) {
    console.error('Error creating interview post:', error);
    return NextResponse.json(
      { success: false, message: '发布失败，请稍后重试' },
      { status: 500 }
    );
  }
}

// GET - 获取用户发布的题目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const company = searchParams.get('company');
    const position = searchParams.get('position');
    const questionType = searchParams.get('questionType');
    const difficulty = searchParams.get('difficulty');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [eq(userInterviewPosts.status, 'active')];

    if (userId) {
      conditions.push(eq(userInterviewPosts.userId, parseInt(userId)));
    }

    if (company && company !== 'all') {
      conditions.push(eq(userInterviewPosts.company, company));
    }

    if (position && position !== 'all') {
      conditions.push(eq(userInterviewPosts.position, position));
    }

    if (questionType && questionType !== 'all') {
      conditions.push(eq(userInterviewPosts.questionType, questionType));
    }

    if (difficulty && difficulty !== 'all') {
      conditions.push(eq(userInterviewPosts.difficulty, difficulty));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 查询数据（包含用户信息）
    const posts = await db
      .select({
        id: userInterviewPosts.id,
        userId: userInterviewPosts.userId,
        company: userInterviewPosts.company,
        position: userInterviewPosts.position,
        questionType: userInterviewPosts.questionType,
        difficulty: userInterviewPosts.difficulty,
        interviewDate: userInterviewPosts.interviewDate,
        question: userInterviewPosts.question,
        recommendedAnswer: userInterviewPosts.recommendedAnswer,
        isAnonymous: userInterviewPosts.isAnonymous,
        viewsCount: userInterviewPosts.viewsCount,
        createdAt: userInterviewPosts.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(userInterviewPosts)
      .leftJoin(users, eq(userInterviewPosts.userId, users.id))
      .where(whereClause)
      .orderBy(desc(userInterviewPosts.createdAt))
      .limit(limit)
      .offset(offset);

    // 获取总数
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userInterviewPosts)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching interview posts:', error);
    return NextResponse.json(
      { success: false, message: '获取题目失败' },
      { status: 500 }
    );
  }
}


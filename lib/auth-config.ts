import { NextAuthOptions } from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { accounts, sessions, users, verificationTokens } from '@/lib/db/schema';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { compare } from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { sendVerificationRequest } from './email-service';

export const authConfig: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  // 添加更详细的日志
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('NextAuth Warning:', code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata);
      }
    },
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    EmailProvider({
      from: 'MockPal <noreply@mockpals.com>',
      sendVerificationRequest,
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.select().from(users).where(eq(users.email, credentials.email)).limit(1);

        if (user.length === 0 || !user[0].passwordHash) {
          return null;
        }

        const passwordValid = await compare(credentials.password as string, user[0].passwordHash);

        if (!passwordValid) {
          return null;
        }

        return {
          id: user[0].id.toString(),
          name: user[0].name,
          email: user[0].email,
          image: user[0].image,
        };
      }
    }),
  ],
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.sub = user.id?.toString();
        token.email = user.email;
        token.name = user.name;
      }
      
      // 处理session更新
      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }
      
      return token;
    },
    async signIn({ user, account, profile }) {
      try {
        // 让DrizzleAdapter处理用户创建，我们只返回true允许登录
        return true;
      } catch (error) {
        console.error('[NextAuth] SignIn error:', error);
        return false;
      }
    },
  },
  events: {
    async createUser({ user }) {
      // 当新用户创建时，异步创建用户profile
      if (user.id && user.email) {
        setTimeout(async () => {
          try {
            const { createProfile } = await import('@/lib/profile');
            await createProfile(parseInt(user.id), {
              jobType: 'DA',
              experienceLevel: '应届',
              targetCompany: '',
              targetIndustry: '',
              technicalInterview: false,
              behavioralInterview: false,
              caseAnalysis: false,
              statsQuestions: false,
              email: user.email!,
              wechat: '',
              linkedin: '',
              bio: '',
              school: '未填写',
            });
            console.log('Profile created for user:', user.id);
          } catch (error) {
            console.error('Failed to create profile for user:', user.id, error);
          }
        }, 100);
      }
    },
  },
  session: {
    strategy: 'jwt', // 使用JWT strategy以支持CredentialsProvider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    }
  }
}
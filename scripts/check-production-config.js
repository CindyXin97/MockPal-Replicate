#!/usr/bin/env node

/**
 * 生产环境配置检查脚本
 * 运行: node scripts/check-production-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 检查生产环境配置...\n');

// 检查邮件配置
function checkEmailConfig() {
  console.log('📧 检查邮件配置:');
  
  const emailServicePath = path.join(__dirname, '../lib/email-service.ts');
  
  if (fs.existsSync(emailServicePath)) {
    const content = fs.readFileSync(emailServicePath, 'utf8');
    
    // 检查是否包含测试环境配置
    if (content.includes('onboarding@resend.dev')) {
      console.log('   ✅ 发现测试环境邮件配置 (onboarding@resend.dev)');
      console.log('   ℹ️  当前配置会根据 NODE_ENV 自动切换');
    }
    
    // 检查是否包含生产环境配置
    if (content.includes('noreply@mockpals.com')) {
      console.log('   ✅ 发现生产环境邮件配置 (noreply@mockpals.com)');
    }
    
    // 检查环境判断逻辑
    if (content.includes('process.env.NODE_ENV === \'production\'')) {
      console.log('   ✅ 环境判断逻辑正常');
    } else {
      console.log('   ⚠️  未找到环境判断逻辑');
    }
  } else {
    console.log('   ❌ 邮件服务文件不存在');
  }
  
  console.log('');
}

// 检查环境变量
function checkEnvironmentVars() {
  console.log('🔧 检查环境变量:');
  
  const requiredVars = [
    'NEXTAUTH_SECRET',
    'RESEND_API_KEY',
    'DATABASE_URL'
  ];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: 已设置`);
    } else {
      console.log(`   ⚠️  ${varName}: 未设置`);
    }
  });
  
  console.log(`   ℹ️  NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log(`   ℹ️  NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '未设置'}`);
  console.log('');
}

// 生成提醒
function generateReminder() {
  console.log('🔔 生产环境推送提醒:');
  console.log('');
  console.log('   在推送到生产环境前，请确保:');
  console.log('   1. 设置 NODE_ENV=production');
  console.log('   2. NEXTAUTH_URL 指向生产域名');
  console.log('   3. 使用生产环境的 RESEND_API_KEY');
  console.log('   4. mockpals.com 域名在 Resend 中已验证');
  console.log('');
  console.log('   📖 详细检查清单: scripts/production-checklist.md');
  console.log('');
}

// 主函数
function main() {
  checkEmailConfig();
  checkEnvironmentVars();
  generateReminder();
  
  console.log('✨ 检查完成!');
}

main(); 
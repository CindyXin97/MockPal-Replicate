'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PostQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  filterOptions: {
    companies: string[];
    positions: string[];
  };
}

export function PostQuestionModal({
  isOpen,
  onClose,
  onSuccess,
  filterOptions,
}: PostQuestionModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    questionType: '',
    difficulty: '',
    interviewDate: '',
    question: '',
    isAnonymous: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (
      !formData.company ||
      !formData.position ||
      !formData.questionType ||
      !formData.difficulty ||
      !formData.interviewDate ||
      !formData.question
    ) {
      toast.error('请填写所有必填字段');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/interview-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('题目发布成功！');
        // 重置表单
        setFormData({
          company: '',
          position: '',
          questionType: '',
          difficulty: '',
          interviewDate: '',
          question: '',
          isAnonymous: false,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(data.message || '发布失败');
      }
    } catch (error) {
      console.error('Error posting question:', error);
      toast.error('发布失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            💭 分享面试经历
          </DialogTitle>
          <DialogDescription className="text-base">
            说说你遇到了什么题目，和大家一起讨论吧
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* 基本信息 - 紧凑布局 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* 公司 */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm">
                🏢 公司 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.company}
                onValueChange={(value) =>
                  setFormData({ ...formData, company: value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 岗位 */}
            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm">
                💼 岗位 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 题目类型 */}
            <div className="space-y-2">
              <Label htmlFor="questionType" className="text-sm">
                📋 题目类型 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.questionType}
                onValueChange={(value) =>
                  setFormData({ ...formData, questionType: value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">🔧 技术</SelectItem>
                  <SelectItem value="behavioral">🧑‍🤝‍🧑 行为</SelectItem>
                  <SelectItem value="case_study">🧩 案例</SelectItem>
                  <SelectItem value="stats">📊 统计</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 难度 */}
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-sm">
                ⭐ 难度 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) =>
                  setFormData({ ...formData, difficulty: value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 面试时间 */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="interviewDate" className="text-sm">
                📅 面试时间 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="interviewDate"
                type="date"
                value={formData.interviewDate}
                onChange={(e) =>
                  setFormData({ ...formData, interviewDate: e.target.value })
                }
                max={new Date().toISOString().split('T')[0]}
                className="h-9"
              />
            </div>
          </div>

          {/* 如果选择"其他"公司，显示自定义输入框 */}
          {formData.company === '其他' && (
            <div className="space-y-2">
              <Label htmlFor="customCompany" className="text-sm">
                请输入公司名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="customCompany"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="例如：Google"
                className="h-9"
              />
            </div>
          )}

          {/* 题目和想法 - 合并为一个文本框 */}
          <div className="space-y-2">
            <Label htmlFor="question" className="text-sm font-medium">
              💬 说说你的面试经历 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              placeholder="分享你的面试经历...

例如：
我面了 Meta 二面，题目是设计一个推荐系统。面试官主要考察了系统设计和trade-off思维。我觉得...想和大家讨论一下有没有更好的方案？"
              rows={12}
              className="resize-none text-sm leading-relaxed"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>描述题目、分享想法、提出疑问</span>
              <span>{formData.question.length} 字</span>
            </div>
          </div>

          {/* 匿名发布（暂时隐藏，后期可以启用） */}
          {/* <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isAnonymous"
              checked={formData.isAnonymous}
              onChange={(e) =>
                setFormData({ ...formData, isAnonymous: e.target.checked })
              }
              className="rounded"
            />
            <Label htmlFor="isAnonymous" className="cursor-pointer">
              匿名发布
            </Label>
          </div> */}

          {/* 提交按钮 */}
          <div className="flex justify-center pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all px-12"
            >
              {loading ? '发布中...' : '发布分享'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center pt-2">
            每天最多发布5条
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}


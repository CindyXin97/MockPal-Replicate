'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { checkNameRequired, updateName } from '@/app/actions/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface NameSetupDialogProps {
  forceCheck?: boolean;
}

export function NameSetupDialog({ forceCheck = false }: NameSetupDialogProps) {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkName() {
      if (status === 'loading') return;
      
      if (status === 'authenticated' && session?.user?.id) {
        setIsChecking(true);
        try {
          const result = await checkNameRequired(session.user.id);
          if (result.required) {
            setIsOpen(true);
            if ('currentName' in result && result.currentName) {
              setName(result.currentName);
            }
          }
        } catch (error) {
          console.error('Check name error:', error);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsChecking(false);
      }
    }

    if (forceCheck || !session?.user?.name) {
      checkName();
    } else {
      setIsChecking(false);
    }
  }, [session, status, forceCheck]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('请输入您的名称');
      return;
    }

    if (!session?.user?.id) {
      toast.error('用户信息未找到');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateName(session.user.id, name.trim());
      
      if (result.success) {
        toast.success('名称设置成功');
        // 更新session中的名称
        await update({ name: name.trim() });
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Update name error:', error);
      toast.error('设置名称失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>完善您的信息</DialogTitle>
          <DialogDescription>
            请设置您的名称，这将帮助其他用户更好地认识您
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">您的名称</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                placeholder="请输入您的名称"
                className="pl-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check } from 'lucide-react';
import api from '@/lib/axios';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 border border-[#262626] bg-[#111111] p-8">
      <SEOHead title="Forgot Password" description="Reset your password" noIndex />
      {sent ? (
        <div className="text-center">
          <Check className="h-12 w-12 text-[#22C55E] mx-auto mb-4" />
          <h1 className="font-syne font-bold text-xl text-white mb-2">Check your email</h1>
          <p className="text-sm text-[#A3A3A3]">If an account exists, we've sent password reset instructions.</p>
        </div>
      ) : (
        <>
          <h1 className="font-syne font-bold text-2xl text-white mb-6">Forgot Password</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-[#EF4444] mt-1">{errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </>
      )}
      <p className="text-sm text-[#A3A3A3] mt-4 text-center">
        <Link to="/account/login" className="hover:text-white">Back to login</Link>
      </p>
    </div>
  );
}

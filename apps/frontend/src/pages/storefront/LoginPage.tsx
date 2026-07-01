import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import type { User } from '@/types';
import { useAppDispatch } from '@/hooks/useStore';
import { setCredentials } from '@/store/authSlice';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ user: User; accessToken: string }>('/auth/login', data);
      const { user, accessToken } = res.data as unknown as { user: User; accessToken: string };
      dispatch(setCredentials({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        accessToken,
      }));
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 border border-[#262626] bg-[#111111] p-8">
      <SEOHead title="Login" description="Sign in to your account" noIndex />
      <h1 className="font-syne font-bold text-2xl text-white mb-6">Sign In</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-[#EF4444] mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-[#EF4444] mt-1">{errors.password.message}</p>}
        </div>
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <p className="text-sm text-[#A3A3A3] mt-4 text-center">
        <Link to="/account/forgot-password" className="hover:text-white">Forgot password?</Link>
      </p>
      <p className="text-sm text-[#A3A3A3] mt-2 text-center">
        No account? <Link to="/account/register" className="text-white hover:underline">Register</Link>
      </p>
    </div>
  );
}

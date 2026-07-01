import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import type { User } from '@/types';
import { useAppDispatch } from '@/hooks/useStore';
import { setCredentials } from '@/store/authSlice';
import { isValidIndianPhone } from '@/lib/utils';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().refine(isValidIndianPhone, 'Enter valid 10-digit Indian phone'),
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ user: User; accessToken: string }>('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });
      const { user, accessToken } = res.data as unknown as { user: User; accessToken: string };
      dispatch(setCredentials({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        accessToken,
      }));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 border border-[#262626] bg-[#111111] p-8">
      <SEOHead title="Register" description="Create your account" noIndex />
      <h1 className="font-syne font-bold text-2xl text-white mb-6">Create Account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(['name', 'email', 'phone', 'password', 'confirmPassword'] as const).map((field) => (
          <div key={field}>
            <Label className="capitalize">{field === 'confirmPassword' ? 'Confirm Password' : field}</Label>
            <Input type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'} {...register(field)} />
            {errors[field] && <p className="text-xs text-[#EF4444] mt-1">{errors[field]?.message}</p>}
          </div>
        ))}
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </Button>
      </form>
      <p className="text-sm text-[#A3A3A3] mt-4 text-center">
        Already have an account? <Link to="/account/login" className="text-white hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

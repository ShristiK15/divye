import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import type { Address, User } from '@/types';
import { isValidIndianPhone, isValidPincode } from '@/lib/utils';
import { INDIA_STATES } from '@/lib/constants';
import { SEOHead } from '@/components/common/SEOHead';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AccountSidebar } from '@/components/storefront/AccountSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().refine(isValidIndianPhone, 'Invalid phone').optional().or(z.literal('')),
});

const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().refine(isValidIndianPhone),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().refine(isValidPincode),
});

type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const addressForm = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  useEffect(() => {
    Promise.all([
      api.get<User>('/auth/me'),
      api.get<Address[]>('/users/addresses').catch(() => ({ data: [] })),
    ]).then(([userRes, addrRes]) => {
      const u = userRes.data as unknown as User;
      setUser(u);
      profileForm.reset({ name: u.name, phone: u.phone ?? '' });
      setAddresses(addrRes.data as unknown as Address[]);
    }).finally(() => setLoading(false));
  }, [profileForm]);

  const saveProfile = async (data: ProfileForm) => {
    await api.patch('/users/me', data);
    setUser((prev) => prev ? { ...prev, ...data } : prev);
  };

  const saveAddress = async (data: AddressForm) => {
    const res = await api.post<Address>('/users/addresses', data);
    setAddresses((prev) => [...prev, res.data as unknown as Address]);
    setShowAddressForm(false);
    addressForm.reset();
  };

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <SEOHead title="Profile" description="Manage your account" noIndex />
      <AccountSidebar />
      <div className="space-y-8">
        <section className="border border-[#262626] p-6">
          <h2 className="font-syne text-lg text-white mb-4">Profile</h2>
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4 max-w-md">
            <div>
              <Label>Name</Label>
              <Input {...profileForm.register('name')} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="opacity-50" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input {...profileForm.register('phone')} />
            </div>
            <Button type="submit">Save Changes</Button>
          </form>
        </section>

        <section className="border border-[#262626] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne text-lg text-white">Addresses</h2>
            <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>Add Address</Button>
          </div>
          {addresses.map((addr) => (
            <div key={addr.id} className="border border-[#262626] p-4 mb-3">
              {addr.isDefault && <span className="text-xs font-mono text-[#22C55E]">Default</span>}
              <p className="text-white text-sm">{addr.name}</p>
              <p className="text-xs text-[#A3A3A3]">{addr.line1}, {addr.city}, {addr.state} {addr.pincode}</p>
            </div>
          ))}
          {showAddressForm && (
            <form onSubmit={addressForm.handleSubmit(saveAddress)} className="space-y-3 mt-4 border border-[#262626] p-4">
              {(['name', 'phone', 'line1', 'line2', 'city', 'pincode'] as const).map((f) => (
                <div key={f}><Label className="capitalize">{f}</Label><Input {...addressForm.register(f)} /></div>
              ))}
              <Select onValueChange={(v) => addressForm.setValue('state', v)}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>{INDIA_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Button type="submit">Save Address</Button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

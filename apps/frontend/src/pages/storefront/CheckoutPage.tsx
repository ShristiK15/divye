import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { calculateGstBreakdown } from 'shared';
import { Check } from 'lucide-react';
import api from '@/lib/axios';
import type { Address, Order, PaymentMethod } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { clearCart } from '@/store/cartSlice';
import { formatINR, isValidIndianPhone, isValidPincode, parseDecimal } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE, INDIA_STATES } from '@/lib/constants';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const addressSchema = z.object({
  name: z.string().min(2),
  phone: z.string().refine(isValidIndianPhone, 'Enter valid 10-digit Indian phone'),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().refine(isValidPincode, 'Enter valid 6-digit pincode'),
});

type AddressForm = z.infer<typeof addressSchema>;

const steps = ['Delivery', 'Payment', 'Review'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
  }, [items, navigate]);

  useEffect(() => {
    api.get<Address[]>('/users/addresses').then((res) => {
      const addrs = res.data as unknown as Address[];
      setAddresses(addrs);
      const def = addrs.find((a) => a.isDefault) ?? addrs[0];
      if (def) setSelectedAddressId(def.id);
    }).catch(() => setShowNewAddress(true));
  }, []);

  const totals = items.reduce(
    (acc, item) => {
      const b = calculateGstBreakdown(item.price, item.gstPercent, item.quantity);
      acc.subtotal += b.subtotal;
      acc.gst += b.gstAmount;
      acc.total += b.total;
      acc.gstByRate[item.gstPercent] = (acc.gstByRate[item.gstPercent] ?? 0) + b.gstAmount;
      return acc;
    },
    { subtotal: 0, gst: 0, total: 0, gstByRate: {} as Record<string, number> }
  );
  const shipping = totals.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const grandTotal = totals.total + shipping;

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      let addressId = selectedAddressId;
      if (showNewAddress || !addressId) {
        const newAddr = await api.post<Address>('/users/addresses', form.getValues());
        addressId = (newAddr.data as unknown as Address).id;
      }

      const res = await api.post<{ order: Order; razorpayOrder?: { id: string; amount: number; currency: string } }>(
        '/orders',
        {
          addressId,
          paymentMethod,
          notes: notes || null,
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        }
      );

      const { order, razorpayOrder } = res.data as unknown as { order: Order; razorpayOrder?: { id: string; amount: number; currency: string } };

      if (paymentMethod === 'RAZORPAY' && razorpayOrder) {
        const rzp = new window.Razorpay({
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          order_id: razorpayOrder.id,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            await api.post(`/orders/${order.id}/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            dispatch(clearCart());
            navigate(`/checkout/success?orderId=${order.id}`);
          },
        });
        rzp.open();
      } else {
        dispatch(clearCart());
        navigate(`/checkout/success?orderId=${order.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SEOHead title="Checkout" description="Complete your order" noIndex />

      <div className="flex items-center justify-between mb-10">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono border ${
              i < step ? 'bg-white text-black border-white' : i === step ? 'bg-white text-black border-white' : 'border-[#262626] text-[#525252]'
            }`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="font-mono text-xs text-[#525252] ml-2 hidden sm:inline">{label}</span>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-[#262626] mx-4" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4">
          <h2 className="font-syne text-xl text-white">Delivery Address</h2>
          {addresses.map((addr) => (
            <button
              key={addr.id}
              type="button"
              onClick={() => { setSelectedAddressId(addr.id); setShowNewAddress(false); }}
              className={`w-full text-left border p-4 ${selectedAddressId === addr.id && !showNewAddress ? 'border-white' : 'border-[#262626]'}`}
            >
              <p className="text-white font-medium">{addr.name}</p>
              <p className="text-sm text-[#A3A3A3]">{addr.line1}, {addr.city}, {addr.state} {addr.pincode}</p>
              <p className="text-xs font-mono text-[#525252]">{addr.phone}</p>
            </button>
          ))}
          <Button variant="outline" onClick={() => setShowNewAddress(true)}>Add New Address</Button>
          {showNewAddress && (
            <form className="space-y-4 border border-[#262626] p-4" onSubmit={form.handleSubmit(() => setStep(1))}>
              {(['name', 'phone', 'line1', 'line2', 'city', 'pincode'] as const).map((field) => (
                <div key={field}>
                  <Label>{field}</Label>
                  <Input {...form.register(field)} />
                  {form.formState.errors[field] && <p className="text-xs text-[#EF4444] mt-1">{form.formState.errors[field]?.message}</p>}
                </div>
              ))}
              <div>
                <Label>State</Label>
                <Select onValueChange={(v) => form.setValue('state', v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIA_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </form>
          )}
          <div>
            <Label>Delivery Instructions (optional)</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#262626] p-3 text-white text-sm mt-1"
              rows={3}
              placeholder="Instructions for the delivery person"
            />
          </div>
          <Button onClick={() => setStep(1)} disabled={!selectedAddressId && !showNewAddress}>Continue</Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-syne text-xl text-white">Payment Method</h2>
          {(['RAZORPAY', 'COD'] as PaymentMethod[]).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`w-full text-left border p-4 ${paymentMethod === method ? 'border-white' : 'border-[#262626]'}`}
            >
              <p className="text-white font-medium">{method === 'RAZORPAY' ? 'Razorpay (UPI / Cards / Net Banking)' : 'Cash on Delivery'}</p>
              {method === 'COD' && <p className="text-xs text-[#525252] mt-1">Pay in cash at delivery. A GST invoice will be emailed.</p>}
            </button>
          ))}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-syne text-xl text-white">Review Order</h2>
          {items.map((item) => (
            <div key={item.variantId} className="flex justify-between text-sm border-b border-[#262626] pb-2">
              <span className="text-white">{item.name} × {item.quantity}</span>
              <span className="font-mono">{formatINR(parseDecimal(item.price) * item.quantity)}</span>
            </div>
          ))}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[#A3A3A3]"><span>Subtotal (excl. GST)</span><span className="font-mono">{formatINR(totals.subtotal)}</span></div>
            {Object.entries(totals.gstByRate).map(([rate, amt]) => (
              <div key={rate} className="flex justify-between text-[#A3A3A3]"><span>GST @ {rate}%</span><span className="font-mono">{formatINR(amt)}</span></div>
            ))}
            <div className="flex justify-between text-[#A3A3A3]"><span>Shipping</span><span className="font-mono">{shipping === 0 ? 'Free' : formatINR(shipping)}</span></div>
            <div className="flex justify-between font-mono text-white text-lg pt-2"><span>Total</span><span>{formatINR(grandTotal)}</span></div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handlePlaceOrder} disabled={submitting} className={submitting ? 'opacity-70 pointer-events-none' : ''}>
              {submitting ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

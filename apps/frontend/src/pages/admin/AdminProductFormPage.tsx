import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateSlug, calculateGstBreakdown } from 'shared';
import api from '@/lib/axios';
import type { Category, Product } from '@/types';
import { GST_RATES } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const variantSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  price: z.string(),
  mrp: z.string(),
  gstPercent: z.string(),
  hsnCode: z.string().optional(),
  stockQty: z.coerce.number(),
  lowStockThreshold: z.coerce.number().default(5),
  isActive: z.boolean().default(true),
});

const formSchema = z.object({
  name: z.string().min(2),
  brand: z.string().min(1),
  categoryId: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  variants: z.array(variantSchema).min(1),
  seo: z.object({
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    slug: z.string(),
    focusKeyword: z.string().optional(),
    keywords: z.array(z.string()).default([]),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;

export default function AdminProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [keywordInput, setKeywordInput] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isActive: true,
      isFeatured: false,
      variants: [{ name: 'Default', sku: '', price: '0', mrp: '0', gstPercent: '18', stockQty: 0, lowStockThreshold: 5, isActive: true }],
      seo: { slug: '', keywords: [] },
    },
  });

  const { fields, append } = useFieldArray({ control: form.control, name: 'variants' });
  const watchName = form.watch('name');
  const watchSeo = form.watch('seo');
  const watchVariants = form.watch('variants');

  useEffect(() => {
    api.get<Category[]>('/categories').then((r) => setCategories(r.data as unknown as Category[]));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    api.get<Product>(`/products/${id}`).then((res) => {
      const p = res.data as unknown as Product;
      form.reset({
        name: p.name,
        brand: p.brand,
        categoryId: p.categoryId,
        description: p.description,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        variants: p.variants.map((v) => ({
          name: v.name, sku: v.sku, price: v.price, mrp: v.mrp, gstPercent: v.gstPercent,
          hsnCode: v.hsnCode ?? '', stockQty: v.stockQty, lowStockThreshold: v.lowStockThreshold, isActive: v.isActive,
        })),
        seo: {
          metaTitle: p.seo?.metaTitle ?? '',
          metaDescription: p.seo?.metaDescription ?? '',
          slug: p.seo?.slug ?? generateSlug(p.name),
          focusKeyword: p.seo?.focusKeyword ?? '',
          keywords: p.seo?.keywords ?? [],
          ogTitle: p.seo?.ogTitle ?? '',
          ogDescription: p.seo?.ogDescription ?? '',
          ogImage: p.seo?.ogImage ?? '',
        },
      });
    }).finally(() => setLoading(false));
  }, [id, isEdit, form]);

  useEffect(() => {
    if (!isEdit && watchName) {
      form.setValue('seo.slug', generateSlug(watchName));
    }
  }, [watchName, isEdit, form]);

  const onSubmit = async (data: FormData, publish = true) => {
    const payload = { ...data, isActive: publish ? data.isActive : false };
    if (isEdit && id) {
      await api.put(`/products/${id}`, payload);
    } else {
      await api.post('/products', payload);
    }
    navigate('/admin/products');
  };

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <form onSubmit={form.handleSubmit((d) => onSubmit(d, true))} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md">
          <h2 className="text-admin-text font-semibold mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div><Label>Name</Label><Input {...form.register('name')} className="bg-admin-bg border-admin-border text-admin-text" /></div>
            <div><Label>Brand</Label><Input {...form.register('brand')} className="bg-admin-bg border-admin-border text-admin-text" /></div>
            <div>
              <Label>Category</Label>
              <Select value={form.watch('categoryId')} onValueChange={(v) => form.setValue('categoryId', v)}>
                <SelectTrigger className="bg-admin-bg border-admin-border text-admin-text"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Description</Label><textarea {...form.register('description')} rows={5} className="w-full bg-admin-bg border border-admin-border text-admin-text rounded-md px-3 py-2" /></div>
          </div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-6 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-admin-text font-semibold">Variants</h2>
            <Button type="button" variant="adminOutline" size="sm" onClick={() => append({ name: '', sku: '', price: '0', mrp: '0', gstPercent: '18', stockQty: 0, lowStockThreshold: 5, isActive: true })}>Add Variant</Button>
          </div>
          {fields.map((field, i) => {
            const v = watchVariants[i];
            const gst = v ? calculateGstBreakdown(v.price, v.gstPercent, 1) : null;
            return (
              <div key={field.id} className="border border-admin-border p-4 mb-4 rounded-md space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input {...form.register(`variants.${i}.name`)} className="bg-admin-bg border-admin-border text-admin-text" /></div>
                  <div><Label>SKU</Label><Input {...form.register(`variants.${i}.sku`)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
                  <div><Label>Price</Label><Input {...form.register(`variants.${i}.price`)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
                  <div><Label>MRP</Label><Input {...form.register(`variants.${i}.mrp`)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
                  <div>
                    <Label>GST %</Label>
                    <Select value={v?.gstPercent} onValueChange={(val) => form.setValue(`variants.${i}.gstPercent`, val)}>
                      <SelectTrigger className="bg-admin-bg border-admin-border text-admin-text"><SelectValue /></SelectTrigger>
                      <SelectContent>{GST_RATES.map((r) => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>HSN</Label><Input {...form.register(`variants.${i}.hsnCode`)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
                  <div><Label>Stock</Label><Input type="number" {...form.register(`variants.${i}.stockQty`)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
                </div>
                {gst && (
                  <div className="bg-admin-bg border border-admin-border p-3 font-mono text-sm text-admin-text-muted">
                    <p>Base Price: {formatINR(gst.subtotal)}</p>
                    <p>GST @ {v.gstPercent}%: {formatINR(gst.gstAmount)}</p>
                    <p>Final Price: {formatINR(gst.total)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4">
          <h2 className="text-admin-text font-semibold">Status</h2>
          <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.watch('isActive')} onCheckedChange={(c) => form.setValue('isActive', c)} /></div>
          <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={form.watch('isFeatured')} onCheckedChange={(c) => form.setValue('isFeatured', c)} /></div>
        </div>

        <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4">
          <h2 className="text-admin-text font-semibold">SEO</h2>
          <div>
            <Label>Meta Title ({watchSeo?.metaTitle?.length ?? 0}/60)</Label>
            <Input {...form.register('seo.metaTitle')} maxLength={60} className="bg-admin-bg border-admin-border text-admin-text" />
          </div>
          <div>
            <Label>Meta Description ({watchSeo?.metaDescription?.length ?? 0}/160)</Label>
            <textarea {...form.register('seo.metaDescription')} maxLength={160} rows={3} className="w-full bg-admin-bg border border-admin-border text-admin-text rounded-md px-3 py-2 text-sm" />
          </div>
          <div><Label>Slug</Label><Input {...form.register('seo.slug')} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
          <div>
            <Label>Keywords</Label>
            <div className="flex gap-2">
              <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} className="bg-admin-bg border-admin-border text-admin-text" onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); if (keywordInput.trim()) { form.setValue('seo.keywords', [...(watchSeo?.keywords ?? []), keywordInput.trim()]); setKeywordInput(''); } }
              }} />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {watchSeo?.keywords?.map((kw, i) => (
                <span key={i} className="text-xs bg-admin-bg border border-admin-border px-2 py-0.5 text-admin-text-muted font-mono">{kw}</span>
              ))}
            </div>
          </div>
          <div className="bg-admin-bg border border-admin-border p-4 rounded-md">
            <p className="text-[#3FB950] font-inter text-xs">divyeelectronics.in › products › {watchSeo?.slug}</p>
            <p className="text-admin-accent font-inter text-sm mt-1">{watchSeo?.metaTitle || watchName} | Divye Electronics</p>
            <p className="text-admin-text-muted font-inter text-xs mt-1">{watchSeo?.metaDescription}</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-admin-bg border border-admin-border p-4 rounded-md flex gap-3">
          <Button type="button" variant="adminOutline" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button type="button" variant="adminOutline" onClick={form.handleSubmit((d) => onSubmit(d, false))}>Save as Draft</Button>
          <Button type="submit" variant="admin">Publish Product</Button>
        </div>
      </div>
    </form>
  );
}

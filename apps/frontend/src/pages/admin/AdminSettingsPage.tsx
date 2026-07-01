import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AdminSettingsPage() {
  const [codEnabled, setCodEnabled] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);

  return (
    <Tabs defaultValue="general">
      <TabsList className="border-admin-border mb-6">
        {['general', 'shipping', 'notifications', 'seo', 'admins'].map((tab) => (
          <TabsTrigger key={tab} value={tab} className="capitalize data-[state=active]:border-admin-accent data-[state=active]:text-admin-text text-admin-text-muted">
            {tab === 'seo' ? 'SEO Defaults' : tab === 'admins' ? 'Admin Users' : tab}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="general">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4 max-w-lg">
          <div><Label>Store Name</Label><Input defaultValue="Divye Electronics" className="bg-admin-bg border-admin-border text-admin-text" /></div>
          <div><Label>Contact Email</Label><Input defaultValue="support@divyeelectronics.in" className="bg-admin-bg border-admin-border text-admin-text" /></div>
          <div><Label>Phone</Label><Input defaultValue="+91 98765 43210" className="bg-admin-bg border-admin-border text-admin-text" /></div>
          <div><Label>GSTIN</Label><Input placeholder="22AAAAA0000A1Z5" className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
          <Button variant="admin">Save General Settings</Button>
        </div>
      </TabsContent>

      <TabsContent value="shipping">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4 max-w-lg">
          <div><Label>Free Shipping Threshold (₹)</Label><Input type="number" defaultValue="999" className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
          <div><Label>Shipping Charge Below Threshold (₹)</Label><Input type="number" defaultValue="49" className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
          <div className="flex items-center justify-between"><Label>COD Enabled</Label><Switch checked={codEnabled} onCheckedChange={setCodEnabled} /></div>
          <Button variant="admin">Save Shipping Settings</Button>
        </div>
      </TabsContent>

      <TabsContent value="notifications">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4 max-w-lg">
          <div className="flex items-center justify-between"><Label>Low Stock Alerts</Label><Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} /></div>
          <div className="flex items-center justify-between"><Label>New Order Alerts</Label><Switch checked={newOrderAlerts} onCheckedChange={setNewOrderAlerts} /></div>
          <div className="flex items-center justify-between"><Label>New Customer Registrations</Label><Switch defaultChecked /></div>
          <Button variant="admin">Save Notification Settings</Button>
        </div>
      </TabsContent>

      <TabsContent value="seo">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4 max-w-lg">
          <div><Label>Default Meta Title Suffix</Label><Input defaultValue="| Divye Electronics" className="bg-admin-bg border-admin-border text-admin-text" /></div>
          <div><Label>Default OG Image URL</Label><Input placeholder="https://..." className="bg-admin-bg border-admin-border text-admin-text" /></div>
          <div><Label>robots.txt</Label><textarea rows={5} className="w-full bg-admin-bg border border-admin-border text-admin-text rounded-md px-3 py-2 text-sm font-mono" defaultValue="User-agent: *\nAllow: /" /></div>
          <Button variant="admin">Generate Sitemap</Button>
        </div>
      </TabsContent>

      <TabsContent value="admins">
        <div className="bg-admin-surface border border-admin-border p-6 rounded-md max-w-lg">
          <p className="text-admin-text-muted text-sm mb-4">Invite admin users by email.</p>
          <div className="flex gap-3">
            <Input placeholder="admin@example.com" className="bg-admin-bg border-admin-border text-admin-text" />
            <Button variant="admin">Invite</Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

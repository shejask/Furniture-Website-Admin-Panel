import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Shield, Palette, Database } from 'lucide-react';

export const metadata = {
  title: 'Settings - Dashboard'
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" defaultChecked />
                  <Label htmlFor="email-notifications">Receive email updates</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="sms-notifications" />
                  <Label htmlFor="sms-notifications">Receive SMS updates</Label>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <Label htmlFor="two-factor">Enable 2FA for extra security</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="order-updates">Order Updates</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="order-updates" defaultChecked />
                  <Label htmlFor="order-updates">New order notifications</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-updates">Payment Updates</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="payment-updates" defaultChecked />
                  <Label htmlFor="payment-updates">Payment status changes</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="marketing">Marketing Emails</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="marketing" />
                  <Label htmlFor="marketing">Promotional content</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize your dashboard appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select 
                  id="theme" 
                  className="w-full p-2 border border-input rounded-md bg-background"
                  defaultValue="system"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <select 
                  id="language" 
                  className="w-full p-2 border border-input rounded-md bg-background"
                  defaultValue="en"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>
                Manage your data and privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data-sharing">Data Sharing</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="data-sharing" />
                  <Label htmlFor="data-sharing">Share analytics data</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookies">Cookie Preferences</Label>
                <div className="flex items-center space-x-2">
                  <Switch id="cookies" defaultChecked />
                  <Label htmlFor="cookies">Accept cookies</Label>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Button variant="outline" className="w-full">
                  Download My Data
                </Button>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <Button className="px-8">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

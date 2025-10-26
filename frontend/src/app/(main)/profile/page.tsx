'use client';

import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';
import React, { useState } from 'react';
// router not required yet

type ProfileData = {
  username: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar?: string;
  email: string;
};

const DUMMY: ProfileData = {
  username: 'abcd-1234',
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Tell us more about yourself!',
  avatar: 'https://example.com/avatar.jpg',
  email: 'peerprepforlife@gmail.com',
};

export default function ProfilePage(): React.ReactElement {
  // router not needed yet, keep for future navigation
  const [data, setData] = useState<ProfileData>(DUMMY);
  const [saving, setSaving] = useState(false);

  function handleChange<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Mock save to sessionStorage
    sessionStorage.setItem('mockProfile', JSON.stringify(data));
    setTimeout(() => setSaving(false), 600);
  }

  return (
    <div className="min-h-(--hscreen) flex items-start justify-center p-8 bg-background">
      <div className="w-full max-w-4xl">
        <Header className="text-center">Manage Your Profile</Header>

        <form onSubmit={handleSave} className="mt-6">
          {/* Top area: avatar at left, username + name fields at right */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2 flex-shrink-0 flex flex-col items-center">
              <div className="w-40 h-40 rounded-full bg-muted/40 flex items-center justify-center">
                <div
                  className="w-36 h-36 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${data.avatar})` }}
                />
              </div>
            </div>

            <div className="col-span-4">
              <div>
                <label className="text-sm font-medium">Username</label>
                <input
                  type="text"
                  value={data.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="mt-2 w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <input
                    value={data.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <input
                    value={data.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border rounded mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Full-width fields below */}
          <div className="mt-6">
            <div className="mt-4">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={data.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="w-full px-3 py-2 border rounded mt-1 h-24"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Avatar URL</label>
              <input
                value={data.avatar}
                onChange={(e) => handleChange('avatar', e.target.value)}
                className="w-full px-3 py-2 border rounded mt-1"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Email</label>
              <input
                value={data.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border rounded mt-1"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                placeholder="••••••"
                className="w-full px-3 py-2 border rounded mt-1"
              />
            </div>

            <div className="mt-6">
              <div className="text-md font-bold text-destructive">Danger Zone</div>
              <div className="mt-3">
                <Button variant="destructive">Delete My Account</Button>
              </div>
              <p className="text-sm text-destructive mt-3">
                <b>Warning:</b> This action is permanent and irreversible!
              </p>
            </div>

            <div className="mt-12 flex justify-center">
              <Button type="submit" variant="attention" size="lg">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';
import type { ContactWithDetails } from '@/types/database';
import type { StageContactsResponse } from '@/types/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailStatus, setEmailStatus] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [campaignKey, setCampaignKey] = useState('inboundagency_launch');
  const [staging, setStaging] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Fetch contacts
  const fetchContacts = async (search: string = '', status: string = 'All') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'All') params.append('email_status', status);

      const url = `/api/contacts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      showNotification('Failed to fetch contacts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(searchQuery, emailStatus);
  }, [emailStatus]);

  const handleSearch = () => {
    fetchContacts(searchQuery, emailStatus);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleStage = async () => {
    if (selectedIds.size === 0) {
      showNotification('Please select at least one contact', 'error');
      return;
    }

    if (!campaignKey) {
      showNotification('Please enter a campaign key', 'error');
      return;
    }

    setStaging(true);
    try {
      const response = await fetch('/api/stage-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_ids: Array.from(selectedIds),
          campaign_key: campaignKey,
        }),
      });

      const data: StageContactsResponse = await response.json();

      if (response.ok && data.success) {
        const message = `Successfully staged ${data.staged_count} contact${data.staged_count !== 1 ? 's' : ''}` +
          (data.skipped_count > 0 ? `, ${data.skipped_count} skipped due to missing required fields` : '');
        showNotification(message, 'success');
        setSelectedIds(new Set());

        // Log errors to console if any
        if (data.errors && data.errors.length > 0) {
          console.log('Staging errors:', data.errors);
        }
      } else {
        showNotification(data.error || 'Failed to stage contacts', 'error');
      }
    } catch (error) {
      console.error('Error staging contacts:', error);
      showNotification('Failed to stage contacts', 'error');
    } finally {
      setStaging(false);
    }
  };

  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-600 text-white text-center p-6 mb-6 rounded-lg border-4 border-red-900">
          <h2 className="text-5xl font-bold">⚠️ CONTACTS PAGE - DEPLOYMENT TEST ⚠️</h2>
          <p className="text-xl mt-3">This warning confirms the latest code is deployed!</p>
        </div>

        <h1 className="text-3xl font-bold mb-2">UI Command Center</h1>
        <p className="text-gray-500 mb-8">Select and stage contacts for campaigns</p>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
              notification.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex gap-2 flex-1">
              <Input
                placeholder="Search by name, company, or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Email Status Filter */}
            <Select
              value={emailStatus}
              onChange={(e) => setEmailStatus(e.target.value)}
              className="w-48"
            >
              <option value="All">All Email Status</option>
              <option value="safe">Safe</option>
              <option value="catch_all">Catch All</option>
              <option value="unsafe">Unsafe</option>
            </Select>
          </div>

          {/* Campaign Staging Row */}
          <div className="flex gap-2">
            <Input
              placeholder="Campaign key"
              value={campaignKey}
              onChange={(e) => setCampaignKey(e.target.value)}
              className="flex-1 sm:w-64"
            />
            <Button
              onClick={handleStage}
              disabled={selectedIds.size === 0 || staging}
            >
              {staging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Staging...
                </>
              ) : (
                `Stage ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`
              )}
            </Button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No contacts found
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Email Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(contact.id)}
                        onChange={(e) => handleSelectOne(contact.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {contact.full_name || '-'}
                    </TableCell>
                    <TableCell>{contact.job_title || '-'}</TableCell>
                    <TableCell>{contact.company_name || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {contact.work_email || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {contact.company_domain || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {contact.email_status || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

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
import { Search, Loader2, AlertCircle } from 'lucide-react';

type Mode = 'enroll' | 'push' | null;

export default function ContactsPage() {
  // Mode state
  const [mode, setMode] = useState<Mode>(null);

  // Mode 1: Enroll Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailStatuses, setEmailStatuses] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [selectedCampaign, setSelectedCampaign] = useState('inboundagency_launch');
  const [enrolling, setEnrolling] = useState(false);

  // Mode 2: Push to Campaigns state
  const [stagedContacts, setStagedContacts] = useState<any[]>([]);
  const [stagedLoading, setStagedLoading] = useState(false);
  const [stagedSelectedIds, setStagedSelectedIds] = useState<Set<string>>(new Set());
  const [stagedCurrentPage, setStagedCurrentPage] = useState(1);
  const [pushing, setPushing] = useState(false);

  // Fetch contacts for Mode 1
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (emailStatuses.length > 0) params.append('email_statuses', emailStatuses.join(','));
      if (selectedCompanies.length > 0) params.append('companies', selectedCompanies.join(','));
      if (titleFilter) params.append('title', titleFilter);

      const url = `/api/contacts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setContacts(data.contacts || []);

      // Extract unique companies from results
      const companies = Array.from(
        new Set(data.contacts.map((c: any) => c.company_name).filter(Boolean))
      ) as string[];
      setAvailableCompanies(companies.sort());
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch staged contacts for Mode 2
  const fetchStagedContacts = async () => {
    setStagedLoading(true);
    try {
      const response = await fetch('/api/staged-contacts?status=staged');
      const data = await response.json();
      setStagedContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching staged contacts:', error);
    } finally {
      setStagedLoading(false);
    }
  };

  // Effect for Mode 1
  useEffect(() => {
    if (mode === 'enroll') {
      fetchContacts();
      setCurrentPage(1);
    }
  }, [mode, emailStatuses, selectedCompanies, titleFilter]);

  // Effect for Mode 2
  useEffect(() => {
    if (mode === 'push') {
      fetchStagedContacts();
      setStagedCurrentPage(1);
    }
  }, [mode]);

  // Mode switching with confirmation
  const handleModeChange = (newMode: Mode) => {
    if (mode !== null && selectedIds.size > 0) {
      if (!confirm('You have contacts selected. Switching modes will clear your selection. Continue?')) {
        return;
      }
    }
    setMode(newMode);
    setSelectedIds(new Set());
    setStagedSelectedIds(new Set());
  };

  // Mode 1: Enroll handler
  const handleEnroll = async () => {
    if (selectedIds.size === 0) {
      alert('Please select at least one contact');
      return;
    }

    if (!confirm(`Enroll ${selectedIds.size} contact${selectedIds.size !== 1 ? 's' : ''} for campaign: ${getCampaignName(selectedCampaign)}?`)) {
      return;
    }

    setEnrolling(true);
    try {
      const selectedContacts = contacts.filter(c => selectedIds.has(c.id));

      const response = await fetch('/api/enroll-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: selectedContacts,
          campaign_key: selectedCampaign,
          campaign_name: getCampaignName(selectedCampaign),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll contacts');
      }

      alert(data.message || `Successfully enrolled ${selectedIds.size} contacts`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Enroll error:', error);
      alert(`Failed to enroll contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Mode 2: Push to Instantly handler
  const handlePushToInstantly = async () => {
    if (stagedSelectedIds.size === 0) {
      alert('Please select at least one contact');
      return;
    }

    if (!confirm(`Push ${stagedSelectedIds.size} contact${stagedSelectedIds.size !== 1 ? 's' : ''} to Instantly?`)) {
      return;
    }

    setPushing(true);
    try {
      const response = await fetch('/api/push-to-instantly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contact_ids: Array.from(stagedSelectedIds),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to push contacts');
      }

      alert(data.message || `Successfully pushed ${stagedSelectedIds.size} contacts to Instantly`);
      setStagedSelectedIds(new Set());
      // Refresh the staged contacts list
      fetchStagedContacts();
    } catch (error) {
      console.error('Push error:', error);
      alert(`Failed to push contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPushing(false);
    }
  };

  // Helper function
  const getCampaignName = (key: string) => {
    const campaigns: Record<string, string> = {
      'inboundagency_launch': 'InboundAgency.com Launch',
      'demo_campaign': 'Demo Campaign',
    };
    return campaigns[key] || key;
  };

  // Pagination for Mode 1
  const totalPages = Math.ceil(contacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = contacts.slice(startIndex, endIndex);

  // Pagination for Mode 2
  const stagedTotalPages = Math.ceil(stagedContacts.length / itemsPerPage);
  const stagedStartIndex = (stagedCurrentPage - 1) * itemsPerPage;
  const stagedEndIndex = stagedStartIndex + itemsPerPage;
  const paginatedStagedContacts = stagedContacts.slice(stagedStartIndex, stagedEndIndex);

  // Selection handlers for Mode 1
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedContacts.map(c => c.id)));
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

  // Selection handlers for Mode 2
  const handleStagedSelectAll = (checked: boolean) => {
    if (checked) {
      setStagedSelectedIds(new Set(paginatedStagedContacts.map(c => c.id)));
    } else {
      setStagedSelectedIds(new Set());
    }
  };

  const handleStagedSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(stagedSelectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setStagedSelectedIds(newSelected);
  };

  const allSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  const allStagedSelected = paginatedStagedContacts.length > 0 && paginatedStagedContacts.every(c => stagedSelectedIds.has(c.id));
  const someStagedSelected = stagedSelectedIds.size > 0 && !allStagedSelected;

  const toggleEmailStatus = (status: string) => {
    setEmailStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-white bg-purple-600 px-4 py-2 rounded mb-2 inline-block">LEMON</div>
        <h1 className="text-3xl font-bold mb-2">UI Command Center</h1>
        <p className="text-gray-500 mb-8">Mode-Based Contact Management</p>

        {/* Mode Selector */}
        <div className="mb-8 p-6 bg-gray-50 border-2 border-gray-300 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Select Workflow Mode
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleModeChange('enroll')}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold text-lg border-2 transition-all ${
                mode === 'enroll'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:shadow'
              }`}
            >
              <div className="text-center">
                <div className="font-bold mb-1">Mode 1: Enroll Contacts</div>
                <div className="text-sm opacity-90">
                  Select contacts from database and stage for campaigns
                </div>
              </div>
            </button>

            <button
              onClick={() => handleModeChange('push')}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold text-lg border-2 transition-all ${
                mode === 'push'
                  ? 'bg-green-600 text-white border-green-700 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-500 hover:shadow'
              }`}
            >
              <div className="text-center">
                <div className="font-bold mb-1">Mode 2: Push to Campaigns</div>
                <div className="text-sm opacity-90">
                  Review staged contacts and push to Instantly
                </div>
              </div>
            </button>
          </div>

          {mode && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">
                <strong>Active Mode:</strong> {mode === 'enroll' ? 'Enroll Contacts' : 'Push to Campaigns'}
              </span>
            </div>
          )}
        </div>

        {/* Mode 1: Enroll Contacts */}
        {mode === 'enroll' && (
          <div>
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
              <h3 className="font-bold text-blue-900 mb-1">Mode 1: Enroll Contacts</h3>
              <p className="text-sm text-blue-800">
                Select contacts from your database and enroll them in a campaign staging pipeline.
              </p>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {contacts.length} contacts
                </span>
                {(emailStatuses.length > 0 || selectedCompanies.length > 0 || titleFilter) && (
                  <span className="text-sm text-blue-600">
                    ({[emailStatuses.length > 0 ? 1 : 0, selectedCompanies.length > 0 ? 1 : 0, titleFilter ? 1 : 0].reduce((a, b) => a + b, 0)} filters active)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {/* Email Status Filter */}
                <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                  <span className="text-sm text-gray-600 mr-1">Email:</span>
                  {['safe', 'catch_all', 'unsafe'].map((status) => (
                    <label key={status} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={emailStatuses.includes(status)}
                        onChange={() => toggleEmailStatus(status)}
                        className="w-4 h-4 text-blue-600 cursor-pointer"
                      />
                      <span className="text-sm capitalize">
                        {status === 'catch_all' ? 'Catch All' : status}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Company Filter */}
                <div className="relative">
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value && !selectedCompanies.includes(e.target.value)) {
                        setSelectedCompanies([...selectedCompanies, e.target.value]);
                      }
                    }}
                    className="w-56"
                  >
                    <option value="">+ Add Company Filter</option>
                    {availableCompanies.map((company) => (
                      <option key={company} value={company} disabled={selectedCompanies.includes(company)}>
                        {company}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Title Filter */}
                <Input
                  placeholder="Filter by title..."
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  className="w-56"
                />

                {/* Clear All Filters */}
                {(emailStatuses.length > 0 || selectedCompanies.length > 0 || titleFilter) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEmailStatuses([]);
                      setSelectedCompanies([]);
                      setTitleFilter('');
                    }}
                    className="text-sm"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* Active Filter Chips */}
              {selectedCompanies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCompanies.map((company) => (
                    <div
                      key={company}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <span>{company}</span>
                      <button
                        onClick={() => setSelectedCompanies(selectedCompanies.filter(c => c !== company))}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Campaign Staging Action Bar */}
            {selectedIds.size > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-800">
                      {selectedIds.size} contact{selectedIds.size !== 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Campaign:</label>
                      <Select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="w-64"
                      >
                        <option value="inboundagency_launch">InboundAgency.com Launch</option>
                        <option value="demo_campaign">Demo Campaign</option>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enrolling...
                      </>
                    ) : (
                      'Stage for Campaign'
                    )}
                  </Button>
                </div>
              </div>
            )}

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
              <>
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
                      {paginatedContacts.map((contact, index) => (
                        <TableRow key={contact.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
                          <TableCell className="text-sm">
                            {contact.work_email ? (
                              <a
                                href={`mailto:${contact.work_email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {contact.work_email}
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {contact.company_domain || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                contact.email_status === 'safe'
                                  ? 'bg-green-100 text-green-800'
                                  : contact.email_status === 'catch_all'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : contact.email_status === 'unsafe'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {contact.email_status || '-'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, contacts.length)} of {contacts.length} contacts
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="text-sm"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              onClick={() => setCurrentPage(pageNum)}
                              className="text-sm w-10 h-10 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Mode 2: Push to Campaigns */}
        {mode === 'push' && (
          <div>
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded">
              <h3 className="font-bold text-green-900 mb-1">Mode 2: Push to Campaigns</h3>
              <p className="text-sm text-green-800">
                Review contacts in staging and push them to Instantly campaigns.
              </p>
            </div>

            {/* Action Bar */}
            {stagedSelectedIds.size > 0 && (
              <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">
                    {stagedSelectedIds.size} contact{stagedSelectedIds.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button
                    onClick={handlePushToInstantly}
                    disabled={pushing}
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    {pushing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Pushing...
                      </>
                    ) : (
                      'Push to Instantly'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Table */}
            {stagedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              </div>
            ) : stagedContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-2">No staged contacts found</p>
                <p className="text-sm">Use Mode 1 to enroll contacts first</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {stagedContacts.length} staged contact{stagedContacts.length !== 1 ? 's' : ''} ready to push
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={allStagedSelected}
                            indeterminate={someStagedSelected}
                            onChange={(e) => handleStagedSelectAll(e.target.checked)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Staged At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStagedContacts.map((contact, index) => (
                        <TableRow key={contact.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <TableCell>
                            <Checkbox
                              checked={stagedSelectedIds.has(contact.id)}
                              onChange={(e) => handleStagedSelectOne(contact.id, e.target.checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {contact.full_name || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {contact.work_email ? (
                              <a
                                href={`mailto:${contact.work_email}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {contact.work_email}
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>{contact.company_name || '-'}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{contact.campaign_name}</div>
                              <div className="text-gray-500 text-xs">{contact.campaign_key}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {new Date(contact.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {stagedTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      Showing {stagedStartIndex + 1} to {Math.min(stagedEndIndex, stagedContacts.length)} of {stagedContacts.length} contacts
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStagedCurrentPage(Math.max(1, stagedCurrentPage - 1))}
                        disabled={stagedCurrentPage === 1}
                        className="text-sm"
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, stagedTotalPages) }, (_, i) => {
                          let pageNum;
                          if (stagedTotalPages <= 5) {
                            pageNum = i + 1;
                          } else if (stagedCurrentPage <= 3) {
                            pageNum = i + 1;
                          } else if (stagedCurrentPage >= stagedTotalPages - 2) {
                            pageNum = stagedTotalPages - 4 + i;
                          } else {
                            pageNum = stagedCurrentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={stagedCurrentPage === pageNum ? 'default' : 'outline'}
                              onClick={() => setStagedCurrentPage(pageNum)}
                              className="text-sm w-10 h-10 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setStagedCurrentPage(Math.min(stagedTotalPages, stagedCurrentPage + 1))}
                        disabled={stagedCurrentPage === stagedTotalPages}
                        className="text-sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* No Mode Selected */}
        {mode === null && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Please Select a Workflow Mode
            </h3>
            <p className="text-gray-500">
              Choose either &quot;Enroll Contacts&quot; or &quot;Push to Campaigns&quot; to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

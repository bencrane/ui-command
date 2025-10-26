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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailStatus, setEmailStatus] = useState('All');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (emailStatus && emailStatus !== 'All') params.append('email_status', emailStatus);
      if (selectedCompanies.length > 0) params.append('companies', selectedCompanies.join(','));
      if (titleFilter) params.append('title', titleFilter);

      const url = `/api/contacts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setContacts(data.contacts || []);

      // Extract unique companies from results
      const companies = Array.from(new Set(data.contacts.map((c: any) => c.company_name).filter(Boolean)));
      setAvailableCompanies(companies.sort());
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    setCurrentPage(1); // Reset to first page when filters change
  }, [emailStatus, selectedCompanies, titleFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(contacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = contacts.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all on current page
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

  const allSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">UI Command Center</h1>
        <p className="text-gray-500 mb-8">Campaign Contacts</p>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Active Filter Count */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {contacts.length} contacts
            </span>
            {(emailStatus !== 'All' || selectedCompanies.length > 0 || titleFilter) && (
              <span className="text-sm text-blue-600">
                ({[emailStatus !== 'All' ? 1 : 0, selectedCompanies.length > 0 ? 1 : 0, titleFilter ? 1 : 0].reduce((a, b) => a + b, 0)} filters active)
              </span>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3">
            {/* Email Status Filter */}
            <Select
              value={emailStatus}
              onChange={(e) => setEmailStatus(e.target.value)}
              className="w-48"
            >
              <option value="All">Email Status: All</option>
              <option value="safe">Email Status: Safe</option>
              <option value="catch_all">Email Status: Catch All</option>
              <option value="unsafe">Email Status: Unsafe</option>
            </Select>

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
            {(emailStatus !== 'All' || selectedCompanies.length > 0 || titleFilter) && (
              <Button
                variant="outline"
                onClick={() => {
                  setEmailStatus('All');
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

          {/* Pagination Controls */}
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
    </div>
  );
}

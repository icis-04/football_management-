import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, XMarkIcon, UserIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { usersApi } from '../../api/users';
import { teamsApi } from '../../api/teams';
import { availabilityApi } from '../../api/availability';
import { debounce } from 'lodash-es';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'user' | 'team' | 'match';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  link: string;
}

interface GlobalSearchProps {
  isMobileTriggered?: boolean;
  onClose?: () => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ 
  isMobileTriggered = false,
  onClose 
}) => {
  const [isOpen, setIsOpen] = useState(isMobileTriggered);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Update isOpen when isMobileTriggered changes
  useEffect(() => {
    if (isMobileTriggered) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isMobileTriggered]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search users
      try {
        const users = await usersApi.getPlayers();
        users
          .filter(user => 
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .forEach(user => {
            searchResults.push({
              id: `user-${user.id}`,
              type: 'user',
              title: user.name,
              subtitle: user.preferredPosition,
              icon: UserIcon,
              link: '#', // For now, just link to current page
            });
          });
      } catch (error) {
        console.error('Error searching users:', error);
      }

      // Search matches
      try {
        const matches = await availabilityApi.getUpcomingMatches();
        matches
          .filter(match => {
            const matchDate = format(new Date(match.date), 'EEEE, MMMM d, yyyy');
            return matchDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   match.dayOfWeek.toLowerCase().includes(searchQuery.toLowerCase());
          })
          .forEach(match => {
            searchResults.push({
              id: `match-${match.date}`,
              type: 'match',
              title: `${match.dayOfWeek} Match`,
              subtitle: format(new Date(match.date), 'MMMM d, yyyy'),
              icon: CalendarIcon,
              link: '/availability',
            });
          });
      } catch (error) {
        console.error('Error searching matches:', error);
      }

      // Search teams (if current teams exist)
      try {
        const currentTeams = await teamsApi.getCurrentTeams();
        if (currentTeams) {
          currentTeams.teams
            .filter(team => 
              team.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              team.players.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            .forEach(team => {
              searchResults.push({
                id: `team-${team.teamNumber}`,
                type: 'team',
                title: team.teamName,
                subtitle: `${team.players.length} players`,
                icon: UsersIcon,
                link: '/teams',
              });
            });
        }
      } catch {
        // No current teams - this is expected
      }

      setResults(searchResults.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => performSearch(searchQuery), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.link);
    setIsOpen(false);
    setQuery('');
    onClose?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Don't render the button if mobile triggered
  if (isMobileTriggered && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Search Button - Only show if not mobile triggered */}
      {!isMobileTriggered && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Search (Cmd+K)"
        >
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
            <span className="text-[10px]">⌘K</span>
          </kbd>
        </button>
      )}

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-start justify-center min-h-screen pt-16 px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
            
            <div
              ref={searchRef}
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
            >
              {/* Search Input */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users, teams, or dates..."
                  className="w-full pl-12 pr-12 py-4 text-lg bg-transparent border-b dark:border-gray-700 focus:outline-none focus:border-primary dark:text-white"
                  autoFocus
                />
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Searching...
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <result.icon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {result.title}
                          </p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 capitalize">
                          {result.type}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="p-8 text-center text-gray-500">
                    No results found for "{query}"
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Start typing to search...
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
                  <span>to navigate</span>
                </span>
                <span className="mx-2">·</span>
                <span className="inline-flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                  <span>to select</span>
                </span>
                <span className="mx-2">·</span>
                <span className="inline-flex items-center space-x-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Esc</kbd>
                  <span>to close</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 
import { Search } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { usePageTranslation } from '@/hooks/useTranslation';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredCount: number;
  totalCount: number;
  selectedCategory: string;
  selectedSubcategory?: string;
  mobileSearchOpen: boolean;
  onMobileSearchToggle: () => void;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  filteredCount,
  totalCount,
  selectedCategory,
  selectedSubcategory,
  mobileSearchOpen,
  onMobileSearchToggle,
}: SearchBarProps) {
  const { t } = usePageTranslation('defi');
  return (
    <div className="space-y-3 md:space-y-0">
      {/* Mobile Layout - Stack vertically - visible only on mobile */}
      <div className="block md:hidden">
        {/* Search Input - When open on mobile */}
        {mobileSearchOpen && (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('defi:search.placeholder')}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-10 h-12 text-base bg-card shadow-sm border-border/50 focus:border-primary/50 w-full rounded-lg"
              onBlur={() => {
                if (!searchQuery) {
                  onMobileSearchToggle();
                }
              }}
              autoFocus
              aria-label={t('defi:search.aria_label', 'Search protocols')}
            />
          </div>
        )}

        {/* Breadcrumb Navigation - Bottom on mobile */}
        {(selectedCategory !== 'All' || selectedSubcategory || searchQuery) && (
          <div className="overflow-x-auto mt-3">
            <Breadcrumb>
              <BreadcrumbList className="flex-nowrap">
                {selectedCategory !== 'All' && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-xs whitespace-nowrap">
                        {selectedCategory === 'All'
                          ? t('defi:filters.all')
                          : t(`defi:categories.${selectedCategory}.name`)}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {selectedSubcategory && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-xs whitespace-nowrap">
                            {selectedSubcategory}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </>
                )}
                {searchQuery && (
                  <>
                    {selectedCategory !== 'All' && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-xs italic whitespace-nowrap">
                        &quot;{searchQuery}&quot;
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
      </div>

      {/* Desktop Layout - Horizontal - visible only on desktop */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between gap-4">
          {/* Results Count and Breadcrumb - Left Side */}
          <div className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {t('defi:search.results').replace(
                  '{{count}}',
                  filteredCount.toString()
                )}{' '}
                {t('defi:search.results_of').replace(
                  '{{total}}',
                  totalCount.toString()
                )}
              </p>

              {/* Breadcrumb Navigation */}
              {(selectedCategory !== 'All' ||
                selectedSubcategory ||
                searchQuery) && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {selectedCategory !== 'All' && (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-sm">
                            {selectedCategory === 'All'
                              ? t('defi:filters.all')
                              : t(`defi:categories.${selectedCategory}.name`)}
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                        {selectedSubcategory && (
                          <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                              <BreadcrumbPage className="text-sm">
                                {selectedSubcategory}
                              </BreadcrumbPage>
                            </BreadcrumbItem>
                          </>
                        )}
                      </>
                    )}
                    {searchQuery && (
                      <>
                        {selectedCategory !== 'All' && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          <BreadcrumbPage className="text-sm italic">
                            &quot;{searchQuery}&quot;
                          </BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
          </div>

          {/* Search - Right Side */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('defi:search.placeholder')}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 h-10 text-sm bg-card shadow-sm border-border/50 focus:border-primary/50 w-64"
              aria-label={t('defi:search.aria_label', 'Search protocols')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Grid3X3,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { categoryDefinitions } from '../data/categories';
import { usePageTranslation } from '@/hooks/useTranslation';

interface FilterControlsProps {
  categories: string[];
  selectedCategory: string;
  selectedSubcategory?: string;
  viewMode: 'grid' | 'table';
  onCategoryChange: (category: string) => void;
  onSubcategoryChange?: (subcategory: string | undefined) => void;
  onViewModeChange: (mode: 'grid' | 'table') => void;
}

export function FilterControls({
  categories,
  selectedCategory,
  selectedSubcategory,
  viewMode,
  onCategoryChange,
  onSubcategoryChange,
  onViewModeChange,
}: FilterControlsProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { t, getText } = usePageTranslation('defi');

  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
      onCategoryChange(category);
      onSubcategoryChange?.(undefined);
      setExpandedCategory(null);
      return;
    }

    if (selectedCategory === category && expandedCategory === category) {
      // If clicking the same selected category that's expanded, collapse it
      setExpandedCategory(null);
    } else if (selectedCategory === category) {
      // If clicking the same selected category that's collapsed, expand it
      setExpandedCategory(category);
    } else {
      // If clicking a different category, select it and expand it
      onCategoryChange(category);
      setExpandedCategory(category);
      onSubcategoryChange?.(undefined);
    }
  };

  const handleSubcategoryClick = (subcategory: string) => {
    if (selectedSubcategory === subcategory) {
      // If clicking the same subcategory, deselect it
      onSubcategoryChange?.(undefined);
    } else {
      // Select the subcategory
      onSubcategoryChange?.(subcategory);
    }
  };

  const getCategoryDefinition = (category: string) => {
    return categoryDefinitions[category as keyof typeof categoryDefinitions];
  };

  // Mobile dropdown for categories and subcategories - single level with indentation
  const MobileFilterDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2 h-10">
          <div className="flex items-center gap-2 min-w-0">
            <Filter className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm truncate">
              {selectedSubcategory
                ? `${selectedCategory} • ${selectedSubcategory}`
                : selectedCategory}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 max-h-[70vh] overflow-y-auto"
        align="start"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('defi:filters.filter_by_category')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* All Categories */}
        <DropdownMenuItem
          className={`cursor-pointer ${selectedCategory === 'All' ? 'bg-primary/10 text-primary' : ''}`}
          onClick={() => {
            onCategoryChange('All');
            onSubcategoryChange?.(undefined);
          }}
        >
          {t('defi:filters.all')}
        </DropdownMenuItem>

        {/* Categories with their subcategories as indented items */}
        {categories
          .filter(cat => cat !== 'All')
          .map(category => {
            const categoryDef = getCategoryDefinition(category);
            const hasSubcategories =
              categoryDef &&
              'subcategories' in categoryDef &&
              categoryDef.subcategories &&
              Object.keys(categoryDef.subcategories).length > 0;

            return (
              <div key={category}>
                {/* Main Category */}
                <DropdownMenuItem
                  className={`cursor-pointer font-medium ${selectedCategory === category && !selectedSubcategory ? 'bg-primary/10 text-primary' : ''}`}
                  onClick={() => {
                    onCategoryChange(category);
                    onSubcategoryChange?.(undefined);
                  }}
                >
                  <div className="flex flex-col gap-0.5 w-full">
                    <span className="font-medium">
                      {t(`defi:categories.${category}.name`)}
                    </span>
                    {categoryDef?.description && (
                      <span className="text-xs text-muted-foreground leading-tight">
                        {getText(categoryDef.description)}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>

                {/* Subcategories - indented */}
                {hasSubcategories &&
                  'subcategories' in categoryDef &&
                  categoryDef.subcategories &&
                  Object.entries(categoryDef.subcategories)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([subcategory, description]) => (
                      <DropdownMenuItem
                        key={`${category}-${subcategory}`}
                        className={`cursor-pointer ml-4 ${selectedSubcategory === subcategory ? 'bg-primary/10 text-primary' : ''}`}
                        onClick={() => {
                          onCategoryChange(category);
                          onSubcategoryChange?.(subcategory);
                        }}
                      >
                        <div className="flex flex-col gap-0.5 w-full">
                          <span className="font-medium text-sm">
                            → {subcategory}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {getText(description)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
              </div>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Desktop category buttons (existing implementation)
  const DesktopCategoryButtons = () => (
    <>
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {categories.map(category => {
          const isSelected = selectedCategory === category;
          const isExpanded = expandedCategory === category;
          const categoryDef = getCategoryDefinition(category);
          const hasSubcategories =
            category !== 'All' &&
            categoryDef &&
            'subcategories' in categoryDef &&
            categoryDef.subcategories &&
            Object.keys(categoryDef.subcategories).length > 0;

          return (
            <Tooltip key={category}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/60 hover:bg-secondary text-secondary-foreground hover:shadow-sm'
                  }`}
                >
                  {category === 'All'
                    ? t('defi:filters.all')
                    : t(`defi:categories.${category}.name`)}
                  {hasSubcategories && (
                    <div className="transition-transform duration-200">
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-xs bg-popover text-popover-foreground border border-border shadow-md [&>svg]:hidden"
              >
                <p className="text-sm font-medium mb-1">
                  {category === 'All'
                    ? t('defi:filters.all')
                    : t(`defi:categories.${category}.name`)}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {category === 'All'
                    ? t('defi:tooltips.category_filter')
                    : categoryDef?.description
                      ? getText(categoryDef.description)
                      : t('defi:fallbacks.defi_protocol_category')}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Desktop Subcategory Dropdown */}
      {expandedCategory &&
        expandedCategory !== 'All' &&
        (() => {
          const categoryDef = getCategoryDefinition(expandedCategory);
          return (
            categoryDef &&
            'subcategories' in categoryDef &&
            categoryDef.subcategories &&
            Object.keys(categoryDef.subcategories).length > 0
          );
        })() && (
          <div className="mt-4 overflow-hidden">
            <div className="animate-in slide-in-from-top-2 duration-300 ease-out">
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
                {/* Compact Header */}
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      {t('defi:filters.subcategories_header').replace(
                        '{{category}}',
                        expandedCategory
                      )}
                    </h4>
                    <button
                      onClick={() => setExpandedCategory(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={t(
                        'common:actions.close_subcategories',
                        'Close subcategories'
                      )}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories as Small Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const categoryDef = getCategoryDefinition(expandedCategory);
                    if (
                      categoryDef &&
                      'subcategories' in categoryDef &&
                      categoryDef.subcategories
                    ) {
                      return Object.entries(categoryDef.subcategories)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([subcategory, description]) => (
                          <Tooltip key={subcategory}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() =>
                                  handleSubcategoryClick(subcategory)
                                }
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                                  selectedSubcategory === subcategory
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-secondary/60 hover:bg-secondary text-secondary-foreground hover:shadow-sm'
                                }`}
                              >
                                {subcategory}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-w-xs bg-popover text-popover-foreground border border-border shadow-md [&>svg]:hidden"
                            >
                              <p className="text-sm font-medium mb-1">
                                {subcategory}
                              </p>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {getText(description)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ));
                    }
                    return [];
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
        {/* Category Filter - Left Side */}
        <div className="flex-1 min-w-0">
          {/* Mobile dropdown - visible only on mobile */}
          <div className="block md:hidden">
            <MobileFilterDropdown />
          </div>
          {/* Desktop buttons - visible only on desktop */}
          <div className="hidden md:block">
            <DesktopCategoryButtons />
          </div>
        </div>

        {/* View Toggle - Right Side */}
        <div className="flex items-center bg-card border rounded-md p-0.5 shadow-sm flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-secondary/60 text-muted-foreground'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-popover text-popover-foreground border border-border [&>svg]:hidden"
            >
              <p className="text-sm">{t('defi:tooltips.grid_view')}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-2 rounded transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-secondary/60 text-muted-foreground'
                }`}
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="bg-popover text-popover-foreground border border-border [&>svg]:hidden"
            >
              <p className="text-sm">{t('defi:tooltips.table_view')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

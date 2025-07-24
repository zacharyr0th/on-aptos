import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
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
  onCategoryChange: (category: string) => void;
  onSubcategoryChange?: (subcategory: string | undefined) => void;
}

export function FilterControls({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
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
        <Button
          variant="outline"
          className="w-full justify-between gap-2 h-12 px-4 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium block truncate">
                {selectedSubcategory
                  ? `${selectedCategory} • ${selectedSubcategory}`
                  : selectedCategory}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('defi:filters.tap_to_filter', 'Tap to filter protocols')}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-[75vh] overflow-y-auto"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t('defi:filters.filter_by_category')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* All Categories */}
        <DropdownMenuItem
          className={`cursor-pointer py-3 px-4 ${selectedCategory === 'All' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
          onClick={() => {
            onCategoryChange('All');
            onSubcategoryChange?.(undefined);
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0" />
            <span className="font-medium">{t('defi:filters.all')}</span>
          </div>
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
                  className={`cursor-pointer py-3 px-4 ${selectedCategory === category && !selectedSubcategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                  onClick={() => {
                    onCategoryChange(category);
                    onSubcategoryChange?.(undefined);
                  }}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="w-2 h-2 rounded-full bg-primary/60 flex-shrink-0 mt-2" />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className="font-medium text-sm">
                        {t(`defi:categories.${category}.name`)}
                      </span>
                      {categoryDef?.description && (
                        <span className="text-xs text-muted-foreground leading-tight">
                          {getText(categoryDef.description)}
                        </span>
                      )}
                    </div>
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
                        className={`cursor-pointer py-3 px-4 ml-6 ${selectedSubcategory === subcategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
                        onClick={() => {
                          onCategoryChange(category);
                          onSubcategoryChange?.(subcategory);
                        }}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0 mt-2" />
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <span className="font-medium text-sm">
                              {subcategory}
                            </span>
                            <span className="text-xs text-muted-foreground leading-tight">
                              {getText(description)}
                            </span>
                          </div>
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
              <div className="p-4">
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
      {/* Mobile dropdown - visible only on mobile */}
      <div className="block md:hidden">
        <MobileFilterDropdown />
      </div>
      {/* Desktop buttons - visible only on desktop */}
      <div className="hidden md:block">
        <DesktopCategoryButtons />
      </div>
    </div>
  );
}

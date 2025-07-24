'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface DialogErrorFallbackProps {
  onCloseDialog?: () => void;
}

export const DialogErrorFallback: React.FC<DialogErrorFallbackProps> = ({
  onCloseDialog,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="py-8 text-center">
      {' '}
      {/* Increased padding for better spacing */}
      <h3 className="text-lg font-semibold mb-3 text-card-foreground">
        {t('messages.details_unavailable', 'Details Unavailable')}
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        {t(
          'messages.dialog_error_message',
          'An error occurred while trying to display the token information. You can try closing and reopening this dialog.'
        )}
      </p>
      {onCloseDialog && (
        <Button onClick={onCloseDialog} variant="outline">
          {t('actions.close_dialog', 'Close Dialog')}
        </Button>
      )}
    </div>
  );
};

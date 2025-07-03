import { useEffect, useRef } from 'react';

type Props = Record<string, any>;

/**
 * Development hook to debug why a component re-rendered
 * Logs which props changed between renders
 */
export function useWhyDidYouUpdate(componentName: string, props: Props): void {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const previousProps = useRef<Props>({});

  useEffect(() => {
    if (previousProps.current && Object.keys(previousProps.current).length) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Props = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log(
          `[WhyDidYouUpdate] ${componentName} re-rendered due to:`,
          changedProps
        );
      }
    }

    previousProps.current = props;
  });
}

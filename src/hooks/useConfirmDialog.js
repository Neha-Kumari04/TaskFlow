import { useCallback, useMemo, useState } from 'react';

import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Cross-platform confirmation dialog.
 *
 * `Alert.alert` is a no-op on react-native-web, so TaskFlow uses its own modal
 * to guarantee the same behaviour on iOS, Android and web.
 */
export function useConfirmDialog() {
  const [request, setRequest] = useState(null);

  const confirm = useCallback((options) => setRequest(options), []);
  const close = useCallback(() => setRequest(null), []);

  const onConfirm = useCallback(() => {
    const handler = request?.onConfirm;
    setRequest(null);
    if (typeof handler === 'function') handler();
  }, [request]);

  const node = useMemo(
    () => (
      <ConfirmDialog
        visible={!!request}
        title={request?.title ?? ''}
        message={request?.message}
        confirmLabel={request?.confirmLabel ?? 'Confirm'}
        cancelLabel={request?.cancelLabel ?? 'Cancel'}
        destructive={request?.destructive ?? false}
        onConfirm={onConfirm}
        onCancel={close}
      />
    ),
    [request, onConfirm, close]
  );

  return { confirm, dialog: node };
}
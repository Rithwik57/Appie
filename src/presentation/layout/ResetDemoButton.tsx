import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from '../../app/store';
import { Button, ConfirmDialog, Toast } from '../components/ui';

/** Restores the fictional seed state through the central state machine. */
export const ResetDemoButton = ({ variant = 'ghost', onReset }: { variant?: 'ghost' | 'secondary'; onReset?: () => void }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const confirm = () => {
    const result = dispatch({ type: 'RESET_DEMO' });
    setOpen(false);
    setMessage(result.ok ? 'Demo data reset to the seed state.' : result.error.message);
    if (result.ok) onReset?.();
  };
  return (
    <>
      <Button variant={variant} icon={RotateCcw} onClick={() => setOpen(true)}>Reset demo data</Button>
      <ConfirmDialog open={open} title="Reset demo data?" confirmLabel="Reset demo data" onCancel={() => setOpen(false)} onConfirm={confirm}>
        This restores the fictional seed episodes and clears local demo progress.
      </ConfirmDialog>
      <Toast message={message} />
    </>
  );
};

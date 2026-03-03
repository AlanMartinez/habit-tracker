import { Modal } from './Modal'
import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Modal
    footer={
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
        <Button
          className="bg-red-600 text-white shadow-none hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-[var(--surface-3)]"
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    }
    onClose={onCancel}
    open={open}
    title={title}
  >
    <p className="text-sm text-[var(--text)]">{description}</p>
  </Modal>
)


import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
} from "lucide-react";

const ConfirmModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#111a2e] shadow-2xl shadow-black/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                danger
                  ? "bg-red-500/10"
                  : "bg-violet-500/10"
              }`}
            >
              {danger ? (
                <AlertTriangle
                  size={21}
                  className="text-red-400"
                />
              ) : (
                <AlertTriangle
                  size={21}
                  className="text-violet-400"
                />
              )}
            </div>

            <div>
              <h2
                id="confirm-modal-title"
                className="text-base font-bold text-white"
              >
                {title}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Confirmation required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close confirmation dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <p className="text-sm leading-6 text-slate-300">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-black/10 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Processing...
              </>
            ) : (
              <>
                {danger && <Trash2 size={17} />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
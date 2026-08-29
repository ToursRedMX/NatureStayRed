import { AlertCircle } from "lucide-react";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

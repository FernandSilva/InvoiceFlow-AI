import { UploadCloud } from "lucide-react";
import { useRef } from "react";

export const UploadDropzone = ({
  onFileSelected,
  helperText,
}: {
  onFileSelected: (file: File) => void;
  helperText: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <button
      type="button"
      className="panel-muted flex w-full flex-col items-center justify-center border border-dashed border-slate-300 px-6 py-12 text-center transition hover:border-brand-300 hover:bg-brand-50/40"
      onClick={() => inputRef.current?.click()}
    >
      <UploadCloud className="h-10 w-10 text-brand-700" />
      <span className="mt-4 text-base font-semibold text-slate-900">Upload document</span>
      <span className="mt-2 max-w-xl text-sm text-slate-600">{helperText}</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onFileSelected(file);
          }
        }}
      />
    </button>
  );
};

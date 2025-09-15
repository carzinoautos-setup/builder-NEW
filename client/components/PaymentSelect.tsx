import React from "react";

interface PaymentSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Array<string | number>;
  allowAny?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

export const PaymentSelect: React.FC<PaymentSelectProps> = ({
  value,
  onChange,
  options,
  allowAny = true,
  placeholder = "Any",
  ariaLabel = "Payment select",
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const display = value === "" || value === null || value === undefined ? placeholder : (String(value).endsWith("+") ? `${String(value)}/mo` : `$${String(value)}/mo`);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((s) => !s)}
        className="w-full h-10 pl-3 pr-10 flex items-center justify-between border border-gray-300 rounded bg-white text-left"
      >
        <span className="inline-flex items-baseline gap-1">
          {display === placeholder ? (
            <span className="text-gray-600">{placeholder}</span>
          ) : (
            <>
              <span className="text-gray-700">$</span>
              <span className="font-semibold text-gray-900">{String(value).endsWith("+") ? String(value) : String(value)}</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </>
          )}
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-600 pointer-events-none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul role="listbox" tabIndex={-1} className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
          {allowAny && (
            <li className="px-3 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => { onChange(""); setOpen(false); }}>
              Any
            </li>
          )}
          {options.map((opt) => (
            <li
              key={String(opt)}
              className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                onChange(String(opt));
                setOpen(false);
              }}
            >
              {String(opt).endsWith("+") ? `${String(opt)}` : `$${String(opt)}/mo`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

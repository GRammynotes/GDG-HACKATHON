import { ChevronDown } from 'lucide-react';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectFieldProps {
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    options: SelectOption[];
}

const SelectField = ({ label, value, onChange, options }: SelectFieldProps) => {
    return (
        <div className="space-y-1.5">
            <label className="label-text">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="input-field appearance-none pr-10"
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
        </div>
    );
};

export default SelectField;

import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';

interface NumberKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];

export function NumberKeypad({ value, onChange, onSubmit }: NumberKeypadProps) {
  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      onChange(value.slice(0, -1) || '0');
      return;
    }

    if (key === '.') {
      // Only one decimal point allowed
      if (value.includes('.')) return;
      onChange(value + '.');
      return;
    }

    // Limit decimal places to 2
    const parts = value.split('.');
    if (parts.length === 2 && parts[1].length >= 2) return;

    // Replace leading zero
    if (value === '0' && key !== '.') {
      onChange(key);
    } else {
      // Limit total length
      if (value.length >= 12) return;
      onChange(value + key);
    }
  };

  return (
    <div className="bg-light-card dark:bg-dark-card border-t border-gray-100 dark:border-zinc-900">
      <div className="grid grid-cols-4 gap-px bg-gray-100 dark:bg-zinc-900">
        {keys.map((key) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.98, backgroundColor: 'rgba(0,0,0,0.05)' }}
            onClick={() => handleKeyPress(key)}
            className="h-14 bg-light-card dark:bg-dark-card flex items-center justify-center"
          >
            {key === 'delete' ? (
              <Delete className="w-6 h-6 text-light-text dark:text-dark-text" />
            ) : (
              <span className="text-xl font-medium text-light-text dark:text-dark-text">
                {key}
              </span>
            )}
          </motion.button>
        ))}

        {/* Submit button spans one column on the right */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          className="row-span-4 bg-cta-blue text-white text-lg font-semibold"
          style={{ gridColumn: 4, gridRow: '1 / 5' }}
        >
          完成
        </motion.button>
      </div>
    </div>
  );
}

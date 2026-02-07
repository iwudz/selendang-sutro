
import { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { UtensilsCrossed, Delete, AlertCircle } from 'lucide-react';

interface PinEntryProps {
  onLogin: (pin: string) => void;
}

export interface PinEntryRef {
  handleInvalidPin: () => void;
}

const PIN_LENGTH = 4;
const PIN_REGEX = /^\d+$/;

const PinEntry = forwardRef<PinEntryRef, PinEntryProps>(({ onLogin }, ref) => {
  const [pin, setPin] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validatePin = useCallback((pin: string): { valid: boolean; message?: string } => {
    if (pin.length !== PIN_LENGTH) {
      return { valid: false, message: `PIN harus ${PIN_LENGTH} digit` };
    }
    if (!PIN_REGEX.test(pin)) {
      return { valid: false, message: 'PIN hanya boleh berisi angka' };
    }
    return { valid: true };
  }, []);

  const handleKeypad = useCallback((val: string) => {
    if (isLoading) return;
    
    if (pin.length >= PIN_LENGTH) return;

    const newPin = pin + val;
    setPin(newPin);
    setIsInvalid(false);
    setError(null);

    if (newPin.length === PIN_LENGTH) {
      setIsLoading(true);
      const validation = validatePin(newPin);
      if (!validation.valid) {
        setError(validation.message || 'PIN tidak valid');
        setIsInvalid(true);
        setPin('');
        setIsLoading(false);
        setTimeout(() => {
          setError(null);
        }, 2000);
      } else {
        setTimeout(() => {
          onLogin(newPin);
          setIsLoading(false);
        }, 200);
      }
    }
  }, [pin, isLoading, onLogin, validatePin]);

  const handleBackspace = useCallback(() => {
    if (isLoading) return;
    
    setPin(pin.slice(0, -1));
    setIsInvalid(false);
    setError(null);
  }, [pin, isLoading]);

  const handleInvalidPin = useCallback(() => {
    setIsInvalid(true);
    setError('PIN yang anda masukkan salah');
    setPin('');
    setIsLoading(false);
    setTimeout(() => {
      setPin('');
      setIsInvalid(false);
      setError(null);
    }, 1500);
  }, []);

  useImperativeHandle(ref, () => ({
    handleInvalidPin
  }));

  return (
    <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-full shadow-2xl">
            <UtensilsCrossed className="w-10 h-10 text-emerald-800" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">SELENDANG SUTRO</h1>
        <p className="text-emerald-100/80 text-sm mb-8">Silahkan masukkan PIN anda</p>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-4 text-red-300 animate-pulse">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                isInvalid 
                  ? 'border-red-500 bg-red-500 scale-125' 
                  : (pin.length > idx ? 'bg-emerald-300 scale-125 border-emerald-300' : 'bg-transparent border-emerald-300')
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeypad(num.toString())}
              disabled={isLoading || pin.length >= PIN_LENGTH}
              className={`bg-white/10 hover:bg-white/20 text-white text-2xl font-semibold py-6 rounded-2xl border border-white/10 active:scale-95 transition-transform ${
                (isLoading || pin.length >= PIN_LENGTH) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeypad('0')}
            disabled={isLoading || pin.length >= PIN_LENGTH}
            className={`bg-white/10 hover:bg-white/20 text-white text-2xl font-semibold py-6 rounded-2xl border border-white/10 active:scale-95 transition-transform ${
              (isLoading || pin.length >= PIN_LENGTH) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={isLoading || pin.length === 0}
            className={`flex items-center justify-center bg-white/10 hover:bg-white/20 text-white py-6 rounded-2xl border border-white/10 active:scale-95 transition-transform ${
              (isLoading || pin.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Delete className="w-8 h-8" />
          </button>
        </div>

        <p className="text-emerald-100/30 text-xs mt-18">
          {pin.length} / {PIN_LENGTH} wudz
        </p>
      </div>
    </div>
  );
});

PinEntry.displayName = 'PinEntry';

export default PinEntry;

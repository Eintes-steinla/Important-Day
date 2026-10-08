import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../components/Text";

type ToastTone = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}
interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DISMISS_AFTER_MS = 3500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
    };
  }, []);

  const show = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setItems((current) => [...current, { id, message, tone }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setItems((current) => current.filter((item) => item.id !== id));
    }, DISMISS_AFTER_MS);
    timers.current.add(timer);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Nằm trên thanh tab; accessibilityLiveRegion để trình đọc màn hình đọc thông báo */}
      <View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        className="absolute inset-x-0 items-center gap-2 px-4"
        style={{ bottom: insets.bottom + 72 }}
      >
        {items.map((item) => (
          <View
            key={item.id}
            className={`max-w-sm rounded-lg px-4 py-2.5 ${item.tone === "error" ? "bg-danger" : "bg-foreground"}`}
          >
            <Text weight="medium" className="text-sm text-background">
              {item.message}
            </Text>
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast phải nằm trong ToastProvider");
  return value;
}

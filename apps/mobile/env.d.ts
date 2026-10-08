// Expo thay các biến EXPO_PUBLIC_* vào code lúc build (phải truy cập đúng dạng process.env.TÊN).
declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    /** Publishable key (sb_publishable_...) hoặc anon key (JWT cũ). Tuyệt đối không dùng service_role. */
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

"use client";

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    let [resource, config] = args;
    config = config || {};
    
    if (typeof resource === 'string' && resource.includes('/api/')) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          if (user.token) {
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${user.token}`
            };
          }
        }
      } catch(e) {}
    }
    
    return originalFetch(resource, config);
  };
}

export default function FetchInterceptor() {
  return null;
}

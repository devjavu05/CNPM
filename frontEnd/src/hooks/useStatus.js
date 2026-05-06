import { useState } from "react";

export default function useStatus() {
  const [status, setStatus] = useState({ type: "", message: "" });

  return {
    status,
    clearStatus: () => setStatus({ type: "", message: "" }),
    setSuccess: (message) => setStatus({ type: "success", message }),
    setError: (message) => setStatus({ type: "error", message })
  };
}

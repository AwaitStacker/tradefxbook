// src/hooks/useAuthForm.js
// Responsibility: manage loading + error state shared by every auth form.
// Keeps pages clean — no repeated useState boilerplate.
import { useState, useCallback } from "react";

export function useAuthForm() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  // Wraps any async action: sets loading, catches errors, resets on start
  const run = useCallback(async (action) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await action();
      return result;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, success, setError, setSuccess, run };
}
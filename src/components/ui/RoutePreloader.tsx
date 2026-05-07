
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { Preloader } from "./Preloader";
import { useAuth } from "@/providers/AuthProvider";

const MIN_ROUTE_LOADING_MS = 450;

export function RoutePreloader({
  minDurationMs = MIN_ROUTE_LOADING_MS,
}: {
  minDurationMs?: number;
}) {
  const { pathname } = useLocation();
  const { isLoading } = useAuth();
  const [routeLoading, setRouteLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;

    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    startTimerRef.current = setTimeout(() => {
      setRouteLoading(true);
    }, 0);

    timerRef.current = setTimeout(() => {
      setRouteLoading(false);
    }, minDurationMs);

    return () => {
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [pathname, minDurationMs]);

  useEffect(() => {
    const clearRouteLoading = () => {
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setRouteLoading(false);
    };

    window.addEventListener("popstate", clearRouteLoading);
    window.addEventListener("pageshow", clearRouteLoading);

    return () => {
      window.removeEventListener("popstate", clearRouteLoading);
      window.removeEventListener("pageshow", clearRouteLoading);
    };
  }, []);

  const show = isLoading || routeLoading;

  const text = useMemo(() => {
    if (isLoading) return "Checking your session";
    return "Loading page";
  }, [isLoading]);

  if (!show) return null;

  return <Preloader text={text} fullScreen />;
}

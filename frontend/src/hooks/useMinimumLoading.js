/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";

export default function useMinimumLoading(loading, minTime = 300) {
  const [showLoading, setShowLoading] = useState(loading);

  useEffect(() => {
    let timer;

    if (loading) {
      setShowLoading(true);
    } else {
      timer = setTimeout(() => {
        setShowLoading(false);
      }, minTime);
    }

    return () => clearTimeout(timer);
  }, [loading, minTime]);

  return showLoading;
}
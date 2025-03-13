import { useEffect } from 'react';

export default function BlogIndex() {
  useEffect(() => {
    window.location.href = '/';
  }, []);

  return <></>;
}

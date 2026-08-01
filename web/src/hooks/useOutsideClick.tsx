import { type RefObject, useEffect } from 'react';

const useOutsideClick = <T extends HTMLElement | null>(
  ref: RefObject<T>,
  callback: () => void,
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('dragstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('dragstart', handleClickOutside);
    };
  }, [ref, callback]);
};

export default useOutsideClick;

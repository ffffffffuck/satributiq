import React from 'react';
import { useTransition, animated } from '@react-spring/web';

const Modal = ({ show, onClose, className, children }) => {
  const transition = useTransition(show, {
    from: {
      scale: 0.98,
      opacity: 0,
    },
    enter: {
      scale: 1,
      opacity: 1,
    },
    leave: {
      scale: 0.9,
      opacity: 0,
    },
    config: (item, state) => {
      switch (state) {
        case 'leave':
          return { duration: 0 };
        default:
          return { duration: 100 };
      }
    },
  });

  const maskTransition = useTransition(show, {
    from: { opacity: 0 },
    enter: { opacity: 0.5 },
    leave: { opacity: 0 },
    config: { duration: 100 },
  });

  return (
    <>
      {maskTransition((style, item) =>
        item && (
          <animated.div
            style={style}
            className='bg-zinc-700 fixed inset-0 flex justify-center blur-3xl items-top z-50'
            onClick={onClose}
          />
        )
      )}
      {transition((style, item) =>
        item && (
          <animated.div
            style={style}
            className={`border-0.1 fixed ${className} justify-center items-top bg-white z-50 shadow-3xl overflow-auto`}
          >
            {children}
          </animated.div>
        )
      )}
    </>
  );
};

export default Modal;
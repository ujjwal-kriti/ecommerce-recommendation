import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const HeroCarousel = ({ slides = [], autoPlay = true, interval = 5000, onSlideChange }) => {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);
  const hovering = useRef(false);

  const goTo = (i) => {
    const next = (i + slides.length) % slides.length;
    setIndex(next);
    if (onSlideChange) onSlideChange(next);
  };

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const start = () => {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (!hovering.current) next();
      }, interval);
    };
    start();
    return () => clearInterval(timerRef.current);
  }, [index, autoPlay, interval, slides.length]);

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full h-56 sm:h-72 lg:h-80 xl:h-96 overflow-hidden rounded-xl shadow-lg"
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
      aria-roledescription="carousel"
    >
      <div
        className="whitespace-nowrap transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={s.id || i} className="inline-block align-top w-full h-full relative">
            <img
              src={s.imageUrl}
              alt={s.alt || s.title || `Slide ${i+1}`}
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/0 to-transparent" />
            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center text-white">
              {s.tag && (
                <span className="inline-block text-xs sm:text-sm bg-white/20 rounded-full px-3 py-1 mb-3 backdrop-blur">
                  {s.tag}
                </span>
              )}
              {s.title && <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold drop-shadow">{s.title}</h2>}
              {s.subtitle && <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl drop-shadow">{s.subtitle}</p>}
              {s.ctaText && (
                <div className="mt-4">
                  <a
                    href={s.ctaLink || '#'}
                    className="inline-flex items-center bg-white text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {s.ctaText}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white"
            aria-label="Next"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/60'} hover:bg-white`}
              aria-label={`Go to slide ${i+1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;

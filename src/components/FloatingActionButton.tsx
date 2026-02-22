"use client";

type Props = {
    onClick: () => void;
};

export default function FloatingActionButton({ onClick }: Props) {
    return (
        <button
            onClick={onClick}
            className="
      fixed bottom-8 right-8 z-50
      size-14 rounded-full
      bg-primary text-white
      flex items-center justify-center
      shadow-lg shadow-primary/30
      hover:scale-105 active:scale-95
      transition-all duration-200
      backdrop-blur-xl
      "
        >
            <span className="material-symbols-outlined text-4xl mb-2">+</span>
        </button>
    );
}

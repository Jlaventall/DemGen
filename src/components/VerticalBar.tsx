import React from 'react';

interface VerticalBarProps {
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
}

export const VerticalBar: React.FC<VerticalBarProps> = ({
    value,
    onChange,
    min = 0,
    max = 2.0
}) => {
    const barRef = React.useRef<HTMLDivElement>(null);

    const handleInteraction = (clientY: number) => {
        if (!barRef.current) return;
        const rect = barRef.current.getBoundingClientRect();
        // Calculate height percentage (0 at bottom, 1 at top)
        const relativeY = clientY - rect.top;
        const percentage = 1 - Math.max(0, Math.min(1, relativeY / rect.height));

        // Map to min-max
        const newValue = min + percentage * (max - min);
        // Round to 1 decimal
        onChange(Number(newValue.toFixed(1)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent text selection
        handleInteraction(e.clientY);

        const moveHandler = (moveEvent: MouseEvent) => {
            handleInteraction(moveEvent.clientY);
        };

        const upHandler = () => {
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
    };

    // Calculate display height
    const percent = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

    // Color logic
    let colorClass = 'bg-blue-400';
    if (value > 1.1) colorClass = 'bg-green-500';
    if (value < 0.9) colorClass = 'bg-red-400';
    if (value === 0) colorClass = 'bg-gray-300'; // Visual indication for masked/zero

    return (
        <div
            ref={barRef}
            className="relative h-24 w-full bg-gray-100 rounded-full overflow-hidden cursor-pointer touch-none"
            onMouseDown={handleMouseDown}
        >
            <div
                className={`absolute bottom-0 w-full rounded-b-full transition-colors duration-200 ${colorClass}`}
                style={{ height: `${percent}%`, transition: 'height 0.1s ease-out' }}
            />
        </div>
    );
};

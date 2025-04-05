import { Slider } from "@/components/ui/slider";

interface InterestSliderProps {
  value: number;
  onValueChange: (value: number) => void;
}

// Hardcoded distribution of items
const items = [
  // 0-30% (High Risk) - Sparse
  { id: 1, price: 5 },
  { id: 2, price: 6 },
  { id: 3, price: 8 },
  { id: 4, price: 12 },
  { id: 5, price: 13 },
  { id: 6, price: 14 },

  // 30-60% (Medium Risk) - More items
  { id: 7, price: 35 },
  { id: 8, price: 35 },
  { id: 9, price: 42 },
  { id: 10, price: 42 },
  { id: 11, price: 43 },
  { id: 12, price: 44 },
  { id: 12, price: 44 },
  { id: 12, price: 45 },
  { id: 13, price: 49 },
  { id: 14, price: 49 },
  { id: 15, price: 56 },
  { id: 16, price: 56 },
  { id: 17, price: 56 },
  { id: 18, price: 56 },
  { id: 19, price: 58 },
  { id: 20, price: 58 },
  { id: 21, price: 58 },
  { id: 22, price: 60 },
  { id: 23, price: 60 },

  // 60-100% (Low Risk) - Medium amount
  { id: 24, price: 69 },
  { id: 25, price: 69 },
  { id: 26, price: 70 },
  { id: 27, price: 72 },
  { id: 28, price: 75 },
  { id: 29, price: 80 },
  { id: 30, price: 82 },
  { id: 31, price: 83 },
  { id: 32, price: 85 },
  { id: 33, price: 90 },
  { id: 34, price: 91 },
  { id: 35, price: 95 },
  { id: 36, price: 100 },
];

export default function InterestSlider({
  value,
  onValueChange,
}: InterestSliderProps) {
  // Define the number of ticks
  const tick_count = 40;
  const minValue = 0.1;
  const maxValue = 100;

  // Calculate the price step based on the min and max prices
  const priceStep = (maxValue - minValue) / tick_count;

  // Calculate item counts for each price range
  const itemCounts = Array(tick_count)
    .fill(0)
    .map((_, tick) => {
      const rangeMin = minValue + tick * priceStep;
      const rangeMax = minValue + (tick + 1) * priceStep;
      return items.filter(
        (item) => item.price >= rangeMin && item.price < rangeMax
      ).length;
    });

  // Find maximum count for scaling
  const maxCount = Math.max(...itemCounts);

  return (
    <div className="*:not-first:mt-4">
      <div>
        {/* Histogram bars */}
        <div className="flex h-12 w-full items-end px-3" aria-hidden="true">
          {itemCounts.map((count, i) => (
            <div
              key={i}
              className="flex flex-1 justify-center"
              style={{
                height: `${(count / maxCount) * 100}%`,
              }}
            >
              <span
                className="h-full w-full"
                style={{
                  background: `linear-gradient(to right, #CB4118 0%, #FFDD00 50%, #6AE084 100%)`,
                  backgroundSize: `${tick_count * 100}% 100%`,
                  backgroundPosition: `${(i / tick_count) * 100}% 0%`,
                }}
              ></span>
            </div>
          ))}
        </div>
        <Slider
          value={[value]}
          onValueChange={(values) => onValueChange(values[0])}
          min={minValue}
          max={maxValue}
          step={1}
          aria-label="Interest rate"
        />
      </div>
    </div>
  );
}

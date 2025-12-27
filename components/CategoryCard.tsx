import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon: string;
  description: string;
  count: number;
}

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/shop?category=${category.name.toLowerCase()}`}
      className="group block p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-primary transition duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-5xl">{category.icon}</div>
        <ChevronRight
          size={24}
          className="text-gray-300 group-hover:text-primary transition"
        />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{category.name}</h3>
      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
      <p className="text-sm font-semibold text-primary">
        {category.count} products
      </p>
    </Link>
  );
}

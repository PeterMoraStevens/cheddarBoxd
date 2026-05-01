export interface CategoryOption {
  value: string // en: slug without the "en:" prefix
  label: string
  group: string
}

export const CATEGORIES: CategoryOption[] = [
  // Snacks & Sweets
  { value: 'snacks',             label: 'Snacks',            group: 'Snacks & Sweets' },
  { value: 'sweet-snacks',       label: 'Sweet Snacks',      group: 'Snacks & Sweets' },
  { value: 'confectioneries',    label: 'Confectionery',     group: 'Snacks & Sweets' },
  { value: 'chocolates',         label: 'Chocolates',        group: 'Snacks & Sweets' },
  { value: 'chocolate-candies',  label: 'Chocolate Candies', group: 'Snacks & Sweets' },
  { value: 'candies',            label: 'Candies',           group: 'Snacks & Sweets' },
  { value: 'biscuits-and-cakes', label: 'Biscuits & Cakes',  group: 'Snacks & Sweets' },
  { value: 'biscuits',           label: 'Biscuits',          group: 'Snacks & Sweets' },
  { value: 'cakes',              label: 'Cakes',             group: 'Snacks & Sweets' },
  // Dairy
  { value: 'dairies',            label: 'Dairy',             group: 'Dairy' },
  { value: 'cheeses',            label: 'Cheeses',           group: 'Dairy' },
  { value: 'yogurts',            label: 'Yogurts',           group: 'Dairy' },
  { value: 'dairy-desserts',     label: 'Dairy Desserts',    group: 'Dairy' },
  { value: 'milks',              label: 'Milk',              group: 'Dairy' },
  // Meat & Fish
  { value: 'meats',              label: 'Meats',             group: 'Meat & Fish' },
  { value: 'prepared-meats',     label: 'Prepared Meats',    group: 'Meat & Fish' },
  { value: 'sausages',           label: 'Sausages',          group: 'Meat & Fish' },
  { value: 'seafood',            label: 'Seafood',           group: 'Meat & Fish' },
  { value: 'fishes',             label: 'Fish',              group: 'Meat & Fish' },
  // Beverages
  { value: 'beverages',          label: 'Beverages',         group: 'Beverages' },
  { value: 'hot-beverages',      label: 'Hot Beverages',     group: 'Beverages' },
  { value: 'coffees',            label: 'Coffee',            group: 'Beverages' },
  { value: 'teas',               label: 'Tea',               group: 'Beverages' },
  { value: 'juices-and-nectars', label: 'Juices',            group: 'Beverages' },
  { value: 'fruit-based-beverages', label: 'Fruit Drinks',   group: 'Beverages' },
  { value: 'alcoholic-beverages', label: 'Alcoholic',        group: 'Beverages' },
  { value: 'plant-based-beverages', label: 'Plant-based Drinks', group: 'Beverages' },
  // Grains & Staples
  { value: 'breakfasts',         label: 'Breakfast',         group: 'Grains & Staples' },
  { value: 'cereals-and-their-products', label: 'Cereals',   group: 'Grains & Staples' },
  { value: 'breads',             label: 'Breads',            group: 'Grains & Staples' },
  { value: 'pastas',             label: 'Pasta',             group: 'Grains & Staples' },
  // Fruits & Veg
  { value: 'fruits-based-foods', label: 'Fruit',             group: 'Fruits & Veg' },
  { value: 'vegetables-based-foods', label: 'Vegetables',    group: 'Fruits & Veg' },
  { value: 'dried-fruits',       label: 'Dried Fruits',      group: 'Fruits & Veg' },
  // Other
  { value: 'meals',              label: 'Meals',             group: 'Other' },
  { value: 'spreads',            label: 'Spreads',           group: 'Other' },
  { value: 'sauces',             label: 'Sauces',            group: 'Other' },
  { value: 'desserts',           label: 'Desserts',          group: 'Other' },
  { value: 'frozen-foods',       label: 'Frozen',            group: 'Other' },
]

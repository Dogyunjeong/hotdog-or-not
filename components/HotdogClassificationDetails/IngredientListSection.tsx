import DetailSection from './DetailSection';

interface IngredientListSectionProps {
  ingredientList: string[];
  className?: string;
}

const IngredientListSection = ({ ingredientList, className }: IngredientListSectionProps) => {
  return (
    <DetailSection title="What's in it" className={className}>
      <ul role="list" className="flex flex-wrap gap-2">
        {ingredientList.map((ingredient, ingredientIndex) => (
          <li
            key={`${ingredient}-${ingredientIndex}`}
            className="rounded-control bg-surface-muted px-3 py-1 text-sm text-foreground"
          >
            {ingredient}
          </li>
        ))}
      </ul>
    </DetailSection>
  );
};

export default IngredientListSection;

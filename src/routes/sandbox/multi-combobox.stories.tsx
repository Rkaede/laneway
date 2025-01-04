import { MultiCombobox } from '~/components/connected/multi-combobox';

export function Basic() {
  return (
    <MultiCombobox
      value={{ type: 'model', id: 'openai/gpt-4' }}
      onSelect={(value) => console.log(value)}
      includeAssistants
      includeModels
    />
  );
}

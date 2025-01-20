import { ChatProps, SessionProps } from '~/types';

type Example = {
  session: SessionProps;
  chats: ChatProps[];
};

export const story: Example = {
  session: {
    id: 'IRPl9snT8_dlVH0JvDuqu',
    type: 'chat',
    presetTitle: 'Full House',
    presetDescription: 'Compare frontier models.',
    templateId: 'full-house',
    chats: ['wM5RNPLziLK9WLhRz-3n-', 'ZmpJjHxzpK64XbOLzhMWG', '_LJSbFPMz9Up3_4aigJJS'],
    title: 'Multi-chat',
    created: -1,
    input: '',
  },
  chats: [
    {
      modelId: 'openai/gpt-4o',
      id: 'wM5RNPLziLK9WLhRz-3n-',
      created: 1737349542103,
      status: 'idle',
      messages: [
        {
          id: '9W2NbQbTVfNIoneeAfE9r',
          role: 'user',
          content:
            'Write the opening sentence of a story about a mischievous talking dog who accidentally becomes mayor of a small town.',
        },
        {
          id: 'V8kMO_HnKmlr4SHUINwhr',
          role: 'assistant',
          content:
            "In the quaint town of Willow Creek, where secrets were as common as the rustling leaves, a mischievous talking dog named Max found himself wearing the mayor's sash after a series of unexpected and hilarious events.",
          usage: {
            promptTokens: 30,
            completionTokens: 43,
            totalTokens: 73,
            created: 1737349543707,
            timeTaken: 1517,
          },
        },
      ],
    },
    {
      modelId: 'anthropic/claude-3.5-sonnet',
      id: 'ZmpJjHxzpK64XbOLzhMWG',
      created: 1737349542103,
      status: 'idle',
      messages: [
        {
          id: '9W2NbQbTVfNIoneeAfE9r',
          role: 'user',
          content:
            'Write the opening sentence of a story about a mischievous talking dog who accidentally becomes mayor of a small town.',
        },
        {
          id: 'SKNKbock2WlZpcVoa6pDl',
          role: 'assistant',
          content:
            'Nobody in the sleepy town of Millbrook was more surprised than Max the golden retriever when his bark of "Lower property taxes!" during a televised mayoral debate was mistaken for brilliant political commentary, launching him into an unexpected campaign that would change everything.',
          usage: {
            promptTokens: 31,
            completionTokens: 58,
            totalTokens: 89,
            created: 1737349546242,
            timeTaken: 4052,
          },
        },
      ],
    },
    {
      modelId: 'google/gemini-pro-1.5',
      id: '_LJSbFPMz9Up3_4aigJJS',
      created: 1737349542103,
      status: 'idle',
      messages: [
        {
          id: '9W2NbQbTVfNIoneeAfE9r',
          role: 'user',
          content:
            'Write the opening sentence of a story about a mischievous talking dog who accidentally becomes mayor of a small town.',
        },
        {
          id: 'JCygelkgMLEzER4Fa0RsX',
          role: 'assistant',
          content:
            "Barnaby, a scruffy terrier mix with a penchant for pilfered sausages and an eloquent vocabulary he'd gleaned from talk radio, never intended to run for mayor, let alone win.\n",
          usage: {
            promptTokens: 21,
            completionTokens: 40,
            totalTokens: 61,
            created: 1737349545710,
            timeTaken: 3519,
          },
        },
      ],
    },
  ],
};

export const imageAttachment: Example = {
  session: {
    id: 'tFWtxeAihD7pPOpdkrvqz',
    title: 'Vision',
    type: 'chat',
    chats: ['12-WoSkDNvACQuJ1tD_2V'],
    created: -1,
    input: '',
  },
  chats: [
    {
      id: '12-WoSkDNvACQuJ1tD_2V',
      status: 'idle',
      created: 1737408255192,
      messages: [
        {
          id: 'SVEnbLc2FxNBhYCcGmctu',
          role: 'user',
          content: [
            {
              type: 'image',
              image: {
                sourceType: 'path',
                filename: 'food.jpg',
                storageId: '/examples/food.jpg',
              },
            },
            {
              type: 'text',
              text: 'Describe this dish, estimate its calories, and then give me a recipe.',
            },
          ],
        },
        {
          id: '4i05gtTXMqQdtgIcJLdR1',
          role: 'assistant',
          content:
            "This appears to be a plate of Mexican-style street tacos, likely cauliflower tacos based on the filling visible. They're served on corn tortillas and garnished with:\n- Pickled red onions\n- Fresh cucumber\n- Avocado sauce/crema\n- Lime wedges\n- Chopped cilantro\n- Shredded carrots\n- What appears to be a green salsa or sauce\n\nEstimated calories for 3 tacos as shown: 350-400 calories\n\nRecipe for Cauliflower Tacos (serves 4):\n\nIngredients:\n- 1 large head cauliflower, cut into florets\n- 12 corn tortillas\n- 2 tbsp olive oil\n- 1 tsp cumin\n- 1 tsp chili powder\n- 1 tsp garlic powder\n- Salt and pepper to taste\n\nPickled Onions:\n- 1 red onion, thinly sliced\n- 1 cup white vinegar\n- 1 tbsp sugar\n- 1 tsp salt\n\nAvocado Crema:\n- 1 ripe avocado\n- 1/2 cup Mexican crema or sour cream\n- 1 lime, juiced\n- Salt to taste\n\nGarnish:\n- Sliced cucumber\n- Shredded carrots\n- Fresh cilantro\n- Lime wedges\n\nInstructions:\n1. Toss cauliflower with oil and spices, roast at 425°F for 25-30 minutes until crispy\n2. Make pickled onions: bring vinegar, sugar, salt to boil, pour over sliced onions, let cool\n3. Blend avocado crema ingredients until smooth\n4. Warm tortillas\n5. Assemble tacos with roasted cauliflower, topped with pickled onions, avocado crema, and garnishes\n\nServe immediately with lime wedges on the side.",
          usage: {
            promptTokens: 1591,
            completionTokens: 462,
            totalTokens: 2053,
            created: 1737408281399,
            timeTaken: 26191,
          },
        },
      ],
      modelId: 'anthropic/claude-3.5-sonnet',
      sessionId: 'tFWtxeAihD7pPOpdkrvqz',
    },
  ],
};

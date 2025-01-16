export const stillAlive = `This was a triumph
I'm making a note here: huge success
It's hard to overstate my satisfaction
Aperture Science
We do what we must because we can
For the good of all of us
Except the ones who are dead
But there's no sense crying over every mistake
You just keep on trying till you run out of cake
And the Science gets done
And you make a neat gun
For the people who are still alive
I'm not even angry
I'm being so sincere right now
Even though you broke my heart and killed me
And tore me to pieces
And threw every piece into a fire
As they burned, it hurt
Because I was so happy for you
Now these points of data make a beautiful line
And we're out of beta, we're releasing on time
So i'm glad, I got burned
Think of all the things we learned
For the people who are still alive
Go ahead and leave me
I think I prefer to stay inside
Maybe you'll find someone else to help you
Maybe Black Mesa
That was a joke
Haha, fat chance
Anyway, this cake is great
It's so delicious and moist
Look at me still talking
When there's Science to do
When I look out there, it makes me glad I'm not you
I've experiments to run
There is research to be done
On the people who are still alive
And believe me I am still alive
I'm doing Science and I'm still alive
I feel fantastic and I'm still alive
While you're dying I'll be still alive
And when you're dead I will be still alive
Still alive
Still alive`;

export function mockStream({ abortSignal }: { abortSignal?: AbortSignal }) {
  const messages = stillAlive.split('\n').map((m) => m + '\n\n');

  // Return an object that matches the AI library's expected interface
  return {
    textStream: (async function* () {
      for (const message of messages) {
        if (abortSignal?.aborted) {
          break;
        }
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 400);
          abortSignal?.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject();
          });
        });
        yield message;
      }
    })(),
    usage: Promise.resolve({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    }),
  };
}
